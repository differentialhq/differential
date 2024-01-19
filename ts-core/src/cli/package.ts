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
import { zip } from "zip-a-folder"; // You can use 'archiver' or any other library for zipping

const log = debug("differential:cli:package");

type PackageDependencies = { [key: string]: string };
type PackageJson = {
  name: string;
  dependencies?: PackageDependencies;
  scripts?: { [key: string]: string };
};

export const buildPackage = async (entrypoint: string, outDir: string) => {
  compile(entrypoint, outDir);
  buildPackageJson(entrypoint, outDir);
  installDependencies(outDir);
  return await zipDirectory(outDir);
};

const compile = (entrypoint: string, outDir: string) => {
  const tsconfigPath = path.join(process.cwd(), "tsconfig.json");
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf-8"));

  tsconfig.compilerOptions.outDir = outDir;
  tsconfig.compilerOptions.rootDir = process.cwd();

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

const listPackageDependencies = (
  packageJsonPath: string,
): PackageDependencies => {
  const packageJsonContent = fs.readFileSync(packageJsonPath, "utf-8");
  const packageJson: PackageJson = JSON.parse(packageJsonContent);
  return packageJson.dependencies || {};
};

// Recursively traverse the file tree to find all requires
const findDependencies = (
  filePath: string,
  walkPath: string,
  paths: string[],
): string[] => {
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
    const dependencies = listFileRequires(fullPath);
    for (const require of dependencies) {
      paths.push(
        // Call recursively with new entrypoint
        ...findDependencies(require, path.dirname(fullPath), paths),
      );
    }
  } else {
    // If not, assume it's a module and add it to the list.
    // This will be filtered further against the origin package.json
    paths.push(filePath);
  }

  return paths;
};

const buildPackageJson = (
  entrypoint: string,
  outDir: string,
  name?: string,
): PackageJson => {
  if (!name) {
    name = path.basename(entrypoint).replace(".ts", "");
  }

  const compiledEntrypoint = entrypoint.replace(".ts", ".js");

  const dependencies = findDependencies(compiledEntrypoint, outDir, []);

  const rootPackageJsonPath = path.join(process.cwd(), "package.json");
  const rootDependencies = listPackageDependencies(rootPackageJsonPath);

  const packageJson: PackageJson = {
    name,
    scripts: {
      start: `node ${compiledEntrypoint}`,
    },
    // Only include dependencies that are used in the origin package.json
    dependencies: dependencies.reduce((acc, dependency) => {
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

  log("Wrote package.json", { dependencies: packageJson.dependencies });
  return packageJson;
};

const installDependencies = (outputDir: string): void => {
  childProcess.execSync(`npm install --production`, {
    cwd: outputDir,
    stdio: "inherit",
  });
};

const zipDirectory = async (directoryPath: string): Promise<string> => {
  const outputZipPath = `${directoryPath}.zip`;
  await zip(directoryPath, outputZipPath);
  return outputZipPath;
};
