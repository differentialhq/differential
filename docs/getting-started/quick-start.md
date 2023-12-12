---
order: 1300
---

# Quick Start with TypeScript

Learn to build an end to end Differential app in under 2 minutes with TypeScript (or JavaScript) and Node.js.

## 1. Set up and Install

Run the following command in your terminal to set up a hello world project

```bash
mkdir differential-hello-world && \
cd differential-hello-world && \
npm init es6 -y && \
npm install @differentialhq/core && \
touch index.js && \
touch differential.js && \
touch hello.js && \
touch worker.js
```

## 2. Initialize the client

Initialise the client in a differential.js file with a demo token from https://api.differential.dev/demo/token.

Demo tokens will expire after 1 hour and will have lower rate limits. But you can get them instantly without signing up.

```ts
// differential.js
import { Differential, PoolConfig } from "@differentialhq/core";

export const d = new Differential(
  "API_SECRET", // replace with your API secret
  // we only need one listener for this example
  [new PoolConfig("hello-worker")]
);
```

## 3. Write the function to invoke remotely

Write a function that you want to invoke remotely. In this case, we will write a function that says hello to a process, on a separate file called hello.js.

```ts
// hello.js
import { d } from "./differential.js";

export const hello = d.fn(
  async (pid) => {
    return `Hello process ${pid}. I'm the process ${process.pid}`;
  },
  {
    poll: "hello-worker",
  }
);
```

## 4. Write the entrypoint to the worker

For your code to run, you need to write an entrypoint to the worker. In this case, we will write an entrypoint that listenes for incoming function calls to the hello function.

```ts
// worker.js
import { d } from "./differential.js";

// import the differential functions so they get registered
// in the worker
import "./hello.js";

d.listen({
  asPool: "hello-worker",
});

console.log("Worker started");
```

## 5. Call the function as if it was a local function

```ts
// index.js
import { hello } from "./hello.js";

hello(process.pid).then(console.log);
```


## 6. Run your solution 🎉

Run the worker in one terminal
```bash
node worker.js
```

And run index.js a few times in different processes.
```bash
for run in {1..5}; do node index.js; done
```

You will see different processes communicating with each other via the Differential API. The output should look something like this:

```
Hello process 24667. I'm the process 33000
Hello process 24666. I'm the process 33000
Hello process 24668. I'm the process 33000
Hello process 24665. I'm the process 33000
Hello process 24669. I'm the process 33000
```