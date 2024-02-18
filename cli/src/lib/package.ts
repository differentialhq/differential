import debug from "debug";
import {
  createProgram,
  getPreEmitDiagnostics,
  flattenDiagnosticMessageText,
} from "typescript";
import * as path from "path";
import * as fs from "fs";
import * as detective from "detective";
import * as childProcess from "child_process";
import { zip } from "zip-a-folder";
import { findServiceRegistration } from "./service-discovery";

const log = debug("differential:cli:package");

const NPM_TARGET_ARCH = "x64";
const NPM_TARGET_PLATFORM = "linux";

type PackageDependencies = { [key: string]: string };
type PackageJson = {
  name: string;
  main?: string;
  dependencies?: PackageDependencies;
  scripts?: { [key: string]: string };
};

export const buildService = async (
  service: string,
  outDir: string,
  entrypoint?: string,
): Promise<{
  packagePath: string;
  definitionPath: string;
}> => {
  const packageOut = path.join(outDir, "package");
  const definitionOut = path.join(outDir, "definition");

  entrypoint = entrypoint || getPackageMain(process.cwd());

  if (!entrypoint) {
    throw new Error(
      "No entrypoint specified and no package.json#main provided",
    );
  }

  compile(entrypoint, packageOut);
  const builtPackage = buildPackage(entrypoint, service, packageOut);
  if (builtPackage.main === undefined) {
    throw new Error("Could not generate entrypoint for service");
  }
  installDependencies(packageOut);
  extractServiceTypes(builtPackage.main, packageOut, definitionOut);

  return {
    packagePath: await zipDirectory(packageOut),
    definitionPath: await zipDirectory(definitionOut),
  };
};

const compile = (entrypoint: string, outDir: string) => {
  const tsconfigPath = path.join(process.cwd(), "tsconfig.json");
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf-8"));

  tsconfig.compilerOptions.outDir = outDir;
  tsconfig.compilerOptions.rootDir = process.cwd();
  tsconfig.compilerOptions.declaration = true;
  tsconfig.compilerOptions.declarationDir = path.join(outDir, "types");

  log("Compiling package", tsconfig.compilerOptions);
  const program = createProgram([entrypoint], tsconfig.compilerOptions);
  const emitResult = program.emit();

  const allDiagnostics = getPreEmitDiagnostics(program).concat(
    emitResult.diagnostics,
  );

  allDiagnostics.forEach((diagnostic) => {
    if (diagnostic.file) {
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start!,
      );
      const message = flattenDiagnosticMessageText(
        diagnostic.messageText,
        "\n",
      );
      console.error(
        `${diagnostic.file.fileName} (${line + 1},${
          character + 1
        }): ${message}`,
      );
    } else {
      console.error(flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
    }
  });

  if (emitResult.emitSkipped) {
    throw new Error("Failed to compile package.");
  }
};

const extractServiceTypes = (
  entrypoint: string,
  packageDir: string,
  outDir: string,
) => {
  const typesPath = path.join(
    packageDir,
    "types",
    `${entrypoint.replace(".js", ".d.ts")}`,
  );
  fs.mkdirSync(outDir, { recursive: true });
  fs.copyFileSync(typesPath, path.join(outDir, "service.d.ts"));
  fs.rmdirSync(path.join(packageDir, "types"), { recursive: true });
};

const listPackageDependencies = (basePath: string): PackageDependencies => {
  const packageJson: PackageJson = getPackageJson(basePath);
  return packageJson.dependencies || {};
};

const getPackageMain = (basePath: string): string | undefined => {
  const packageJson = getPackageJson(basePath);
  return packageJson.main;
};

// Recursively traverse the file tree to find all requires
const findDependencies = (
  filePath: string,
  walkPath: string,
  paths: string[],
  serviceRegistrations = new Map<string, string>(),
): {
  dependencies: string[];
  serviceRegistrations: Map<string, string>;
} => {
  // Find all `requires` in a file
  const listFileRequires = (filePath: string): string[] =>
    detective
      .find(fs.readFileSync(filePath, "utf-8"), {
        nodes: "true",
      })
      .nodes?.map((node: any) => node.arguments[0].value as string) ?? [];

  let fullPath = [walkPath, filePath].join("/");
  fullPath = fullPath.endsWith(".js") ? fullPath : fullPath.concat(".js");

  log("Evaluating path", { walkPath, filePath, fullPath });

  // Check if file exists and if so walk it's dependencies recursively
  if (fs.existsSync(fullPath)) {
    const registration = findServiceRegistration(fullPath);
    if (registration) {
      serviceRegistrations.set(registration, fullPath);
    }

    const dependencies = listFileRequires(fullPath);
    for (const require of dependencies) {
      const subEval = findDependencies(
        require,
        path.dirname(fullPath),
        paths,
        serviceRegistrations,
      );
      paths.push(
        // Call recursively with new entrypoint
        ...subEval.dependencies,
      );

      serviceRegistrations = new Map([
        ...serviceRegistrations,
        ...subEval.serviceRegistrations,
      ]);
    }
  } else {
    // If not, assume it's a module and add it to the list.
    // This will be filtered further against the origin package.json
    paths.push(filePath);
  }

  return {
    dependencies: paths,
    serviceRegistrations,
  };
};

const buildPackage = (
  entrypoint: string,
  service: string,
  outDir: string,
): PackageJson => {
  const compiledEntrypoint = entrypoint.replace(".ts", ".js");

  const result = findDependencies(compiledEntrypoint, outDir, []);
  const registration = result.serviceRegistrations.get(service);

  if (!registration) {
    throw new Error(`Service registration for ${service} not found`);
  }

  const serviceEntrypoint = path.relative(outDir, registration);

  const rootDependencies = listPackageDependencies(process.cwd());

  const packageJson: PackageJson = {
    name: service,
    main: serviceEntrypoint,
    // Only include dependencies that are used in the origin package.json
    dependencies: result.dependencies.reduce((acc, dependency) => {
      if (rootDependencies[dependency]) {
        acc[dependency] = rootDependencies[dependency];
      }
      return acc;
    }, {} as PackageDependencies),
  };

  const packageJsonPath = path.join(outDir, "package.json");

  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2),
    "utf-8",
  );

  buildIndex(serviceEntrypoint, outDir);

  log("Wrote package.json", { dependencies: packageJson.dependencies });
  return packageJson;
};

const buildIndex = async (entrypoint: string, outDir: string) => {
  const indexFilePath = path.join(outDir, "differential-index.js");

  if (fs.existsSync(indexFilePath)) {
    throw new Error("Differential index file already exists.");
  }

  fs.writeFileSync(
    indexFilePath,
    `exports.handler = () => { require('./${entrypoint}').default.start()};`,
    "utf-8",
  );
};

const installDependencies = (outputDir: string): void => {
  childProcess.execSync(
    `npm install --production --target_arch=${NPM_TARGET_ARCH} --target_platform=${NPM_TARGET_PLATFORM}`,
    {
      cwd: outputDir,
      stdio: "ignore",
    },
  );
};

const getPackageJson = (packagePath: string): PackageJson => {
  const packageJsonPath = path.join(packagePath, "package.json");
  const packageJsonContent = fs.readFileSync(packageJsonPath, "utf-8");
  return JSON.parse(packageJsonContent);
};

const zipDirectory = async (directoryPath: string): Promise<string> => {
  const outputZipPath = `${directoryPath}.zip`;
  await zip(directoryPath, outputZipPath);
  return outputZipPath;
};
