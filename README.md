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
  machineType: process.env.MACHINE_TYPE,
});

let greetingCounts = 0;

// define any function
const greet = (name: string) => {
  console.log(`Hello ${name} from pid ${process.pid}!`);
}

// count greetings
const countGreets = d.fn(() => {
  greetingCounts++;
  console.log(`Greeted ${greetingCounts} times!`);
}, { machineType: "counter"})

if (process.env.MACHINE_TYPE === "greeter") {
  // run the function
  greet("World")
} else {
  // keep the process alive so we can count greets
  process.stdin.resume();
}
```
