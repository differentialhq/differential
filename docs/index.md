---
order: 1500
---

# Differential

> Build and Connect production services 10x faster with delightful DX!

Differential is a platform that enables developers to turn every functions into typesafe services, without spending additional effort on managing service contracts. It currently has first class support for Typescript.

## How does it look?

### 1. Initialize your codebase

Keep your code co-located, and define your services in the `services/` directory - or not. It's up to you. 

It only matters whether your service consumers can access the types of the service definition file.

```ts
src/
 |- services/
 |    └- my-service.ts
 |- index.ts
 └- d.ts
```

### 2. Define a service

Running this code will start your service and advertise it to the Differential network.

```ts
// services/my-service.ts
import { d } from "../d.ts";

const service = d.service({
  name: "my-service",
  functions: {
    hello: async (name: string) => {
     return `Hello ${name}!`;
    }
  }
});

// start the service
await service.start();

// you can stop the service by calling 
// service.stop() anytime, but it's recommended 
// to do it on process exit.
process.on("beforeExit", async () => {
  await service.stop();
});
```

### 3. Call the service

Running this code in another process will call the service and return the result.

```ts
// index.ts

import typeof { service } from "./services/my-service.ts";
import { d } from "./d.ts";

const result = 
  await d.call<typeof service, "hello">("hello", "World");

console.log(result); // Hello World!
```

## Why should I use it?
- **Just focus on the functions**: 
  - It simplifies the process of splitting and managing services
  - Completely abstracts away the network communication, serialization, and transport protocols.
- **Secure RPC Endpoints**: 
  - Your functions are only accessible through the differential cluster. 
  - This means you don't have to worry about service to service authentication, and can focus on the business logic. 
  - The usual problems of exposing endpoints to the internet are also non-existent.
- **Maintains a unified codebase**: 
  - You don't have to split the codebase to split your services. 
  - A simple `d.service()` will register a collection of functions as a service.
  - Instead, you can deploy your code as a unified codebase, and start individual services by calling `service.start()`.
- **Automated Service Contracts**: 
  - Because service contracts are inferred by Typescript types, you don't have to worry about maintaining a separate contract file like in other RPC frameworks.
  - The obvious trade-off here is that contracts don't validate the data at runtime, but it's trivial to add runtime validation if you need it.
