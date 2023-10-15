<p align="center">
  <img src="./assets/logo.png" width="200" style="border-radius: 10px" />
</p>

# Differential SDK

This is the official Differential SDK for JavaScript.

## What is Differential?

Differential is both a novel and obvious way to think about distributed computing.

By focusing on the function as the fundamental unit, it abstracts away the complexities of distribution, allowing for code to run across various compute nodes.

No more wrestling with message queues or duplicated interfaces. You write once and let the framework handle the distributed execution logic.

## Installation

```bash
npm install @differential-dev/sdk
```

## Quick Start

```ts
import process from 'process';
import { Differential } from "@differential-dev/sdk";

export const d = Differential({
  apiSecret: "sk_excellent_beans_1234",
});

// initialize the communication. this starts listening for queued function calls
d.listen({
  asMachineTypes: ["worker"], // this listening process will run as the "worker" machine type
});

// define any function and wrap it with d.fn to run it in a distributed manner
const helloWorld = d.fn((pid) => {
  return `Hello from pid ${process.pid}!`;
}, {
  runOn: "worker", // this function will only run on workers
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