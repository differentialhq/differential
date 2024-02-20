import debug from "debug";

import * as walk from "acorn-walk";
import * as acorn from "acorn";
import * as fs from "fs";

const log = debug("differential:cli:service-discovery");

export const findServiceRegistration = (
  entrypoint: string,
): string | undefined => {
  const file = fs.readFileSync(entrypoint, "utf-8");
  const ast = acorn.parse(file, {
    // TODO: Determine from tsconfig
    ecmaVersion: 2020,
    sourceType: "module",
  });

  const serviceRegistrations: string[] = [];
  walk.simple(ast, {
    AssignmentExpression(node) {
      if (
        node.left.type === "MemberExpression" &&
        node.left.object.type === "Identifier" &&
        node.left.object.name === "exports" &&
        node.left.property.type === "Identifier" &&
        node.right.type === "CallExpression"
      ) {
        const service = isServiceRegistration(node.right, ast);
        if (service) {
          if (node.left.property.name === "default") {
            serviceRegistrations.push(service);
          } else {
            console.error(
              `Found service registration for ${service}, but it was not a default export`,
            );
          }
        }
      }
    },
  });

  if (serviceRegistrations.length === 1) {
    return serviceRegistrations[0];
  }

  // This shouldn't be possible as we are only evaluating the default export
  if (serviceRegistrations.length > 1) {
    console.error(`Found multiple service registrations in ${entrypoint}.`);
  }
};

const findVariableDeclaration = (
  node: acorn.Node,
  target: string,
): acorn.ObjectExpression | undefined => {
  log(`Searching for variable declaration for ${target}`);

  // Find the variable declaration for the identifier
  let result;
  walk.simple(node, {
    VariableDeclaration(node) {
      for (const declaration of node.declarations) {
        if (
          declaration.id.type === "Identifier" &&
          declaration.id.name === target
        ) {
          if (declaration.init?.type === "ObjectExpression") {
            result = declaration.init;
          }
        }
      }
    },
    // TODO: Check if the variable was imported from another file and log an error
  });

  return result;
};

const parseServiceRegistration = (
  node: acorn.ObjectExpression,
): { name: string } | undefined => {
  log("Checking if object contains correct properties");
  const expectedProperties = ["name", "functions"];
  const foundProperties: Map<string, acorn.Property> = new Map();

  const properties = node.properties;
  for (const prop of properties) {
    if (prop.type === "Property") {
      if (prop.key.type === "Identifier") {
        foundProperties.set(prop.key.name, prop);
      }
    }
    // TODO: handle spread properties
    if (prop.type === "SpreadElement") {
      console.error(
        "Spread properties not yet supported in service registration.",
      );
      console.error(
        "Please pass d.service() an object literal with name and functions properties only",
      );
      return;
    }
  }
  if (expectedProperties.every((prop) => foundProperties.has(prop))) {
    log("Object contains expected properties");
    return {
      name: (foundProperties.get("name")?.value as any).value,
    };
  }
  log("Object does not contain expected properties");
  return;
};
const isServiceRegistration = (
  node: acorn.CallExpression,
  root: acorn.Node,
): string | undefined => {
  if (
    node.callee.type === "MemberExpression" &&
    node.callee.property.type === "Identifier" &&
    node.callee.property.name === "service" &&
    node.arguments.length == 1
  ) {
    const arg = node.arguments[0];
    log("Found call to function named 'service'");
    if (arg.type === "Identifier") {
      // The `service()` function was called with a variable
      // Search the file for the variable declaration
      const variableDeclaration = findVariableDeclaration(root, arg.name);
      if (variableDeclaration) {
        return parseServiceRegistration(variableDeclaration)?.name;
      }
    }
    if (arg.type === "ObjectExpression") {
      return parseServiceRegistration(arg)?.name;
    }
  }
};
