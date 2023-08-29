# Differential SDK JS

This is the official Differential SDK for JavaScript.

## What is Differential?

Differential is both a novel and obvious way to think about distributed computing. By focusing on the function as the fundamental unit, it abstracts away the complexities of distribution, allowing for code to run optimally across various compute nodes. No more wrestling with message queues or inconsistent interfaces. You write once and let the framework handle the distributed execution logic.

## Installation

```bash
npm install @differential-dev/sdk
```

## Quick Start

```ts
import process from 'process';
import { Differential } from "@differential-dev/sdk";

export const d = Differential({
  apiKey: "123",
  apiSecret: "456",
  environmentId: "dev-1",
});

// initialize the communication. this starts listening for incoming function calls
d.listen({
  machineTypes: ["worker"], // this listening process will only run worker functions
});

// define any function and wrap it with d.fn to run it in a distributed manner
const helloWorld = d.fn((pid) => {
  return `Hello from pid ${process.pid}!`;
}, {
  machineType: "worker", // this function will only run on workers
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
