<p align="center">
  <img src="https://cdn.differential.dev/logo.png" width="200" style="border-radius: 10px" />
</p>

# Differential SDK

This is the official Differential SDK for JavaScript. 

Differential allows two or more compute instances to communicate with each other just by calling functions.

This allows you to easily distribute work across multiple machines, and even across multiple processes on the same machine, without having to worry about the underlying communication logic like building a message queue or setting up a REST API.

## Installation

```bash
npm install @differentialhq/core
```

## Quick Start

```ts
import process from 'process';
import { Differential } from "@differentialhq/core";

export const d = Differential({
  apiSecret: "sk_excellent_beans_1234",
});

// initialize the communication. this starts listening for queued function calls
d.listen({
  asPool: "worker", // this listening process will run as the "worker" worker pool
});

// define any function and wrap it with d.fn to run it in a distributed manner
const helloWorld = d.fn((pid) => {
  return `Hello from pid ${process.pid}!`;
}, {
  pool: "worker", // this function will only run on workers
})

// call the function as if it were a normal function in the same process
// the SDK will handle the distribution logic
helloWorld(process.pid).then((result) => {
  console.log(result);
});

// call d.quit() on process exit to gracefully shut down the SDK
process.on("exit", () => {
  d.quit();
});
```

## Examples

1. [Counter / Greeter](./examples/1_greet) shows how two independent processes can communicate with each other.

2. [API / Worker](./examples/2_api) shows how to create a simple API that offloads work to a worker process that gets executed in the background (set and forget).
