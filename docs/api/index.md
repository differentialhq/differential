---
icon: gear
expanded: true
---

# API Reference

This is the official documentation for Differential SDK for Typescript. Package source code is available [here](https://github.com/differentialhq/differential/tree/main/ts-core).

## Installation

```bash
npm install @differentialhq/core
```

## Basic Usage

### 1. Initializing Differential

Create a file named d.ts which will be used to initialize Differential. This file will export the Differential instance.

```typescript
// d.ts

import { Differential } from "@differentialhq/core";

// Initialize Differential with your API secret
export const d = new Differential("YOUR_API_SECRET");
```

### 2. Hello World Service

In a separate file, create the "Hello World" service. This file will import the Differential instance from d.ts and define the service.

```typescript
// service.ts

import { d } from "./d";

// Define a simple function that returns "Hello, World!"
const sayHello = async (to: string) => {
  return `Hello, ${to}!`;
};

// ...and as many other functions as you want, any async function can be a service operation
const callEndpoint = async () => {
  return fetch("https://api.example.com");
};

// Register the function as a service
export const helloWorldService = d.service({
  name: "helloWorld",
  functions: {
    sayHello,
    callEndpoint,
  },
});
```

### 3. Calling the Service

Use the typeof generic to generate a typesafe client for calling the service. This can be done in any file where you need to call the service, like a test file or another service file.

```typescript
// service-consumer.ts

import { d } from "./d";
import type { helloWorldService } from "./service";

// Generate a typesafe client for calling the `helloWorld` service
const client = d.client<typeof helloWorldService>("helloWorld");

async function test() {
  // Call the `sayHello` function on the `helloWorld` service
  const greeting = await client.sayHello("World");
  console.log(greeting); // Outputs: Hello, World!
}

test();
```

### 4. Running the Service

To run the service, simply run the file with the service definition. This will start the service and make it available to other services.

```bash
tsx service.ts
```

and then you can invoke the service from another file:

```bash
tsx service-consumer.ts
```