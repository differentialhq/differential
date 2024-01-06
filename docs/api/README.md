<p align="center">
  <img src="https://cdn.differential.dev/logo.png" width="200" style="border-radius: 10px" />
</p>

# Typescript SDK

This is the official Differential SDK for Typescript.

## Installation

### npm

```bash
npm install @differentialhq/core
```

### yarn

```bash
yarn add @differentialhq/core
```

### pnpm

```bash
pnpm add @differentialhq/core
```

## Quick Start

### 1. Initializing Differential

Create a file named d.ts which will be used to initialize Differential. This file will export the Differential instance.

```typescript
// d.ts

import { Differential } from "@differentialhq/core";

// Initialize Differential with your API secret. 
// Get yours at https://console.differential.dev.
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

When calling the service, use the typeof generic to ensure type safety. This can be done in any file where you need to call the service, like a test file or another service file.

```typescript
// service-consumer.ts

import { d } from "./d";
import type { helloWorldService } from "./service";

const client = d.client<typeof helloWorldService>("helloWorld");

async function test() {
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

## Documentation

- [Differential documentation](https://docs.differential.dev/) contains all the information you need to get started with Differential.

## Examples

- [Monolith](./src/tests/monolith/) contains an example of a monolith application broken into multiple services.
- [End to end encryption](./src/tests/e2ee/) contains an example of how to use Differential's end to end encryption.
- [Idempotency](./src/tests/idempotency/) contains an example of how to use Differential's idempotency.
