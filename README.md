<p align="center">
  <img src="https://cdn.differential.dev/logo.png" width="200" style="border-radius: 10px" />
</p>

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/differentialhq/differential/test.yml) ![NPM Downloads](https://img.shields.io/npm/dm/%40differentialhq%2Fcore) ![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/%40differentialhq%2Fcore) ![NPM Version](https://img.shields.io/npm/v/%40differentialhq%2Fcore?logo=npm&label=%40differentialhq%2Fcore)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/differentialhq/differential)

# Differential

Differential is an open-source application code aware service mesh (control-plane) and a set of adapters (client libraries) which connects your services together with first-class support for Typescript.

1. Differential builds on the concepts developers are already familiar with, and doesn't require you to learn a new programming model.
2. Services are collections of plain old javascript functions which can be deployed in almost any compute. Services ship their own type-safe Typescript clients.
3. The control plane takes care of routing data between the functions, and recovering from transient failures, transparently.

## Why would I use it?

1. Create services out of plain old Typescript functions, and get type-safe clients for free.
2. Adopt a service-oriented architecture without changing your codebase / programming model.
3. Recover your workloads from crashes and network failures without custom code.

## What does the code look like?

![Alt text](assets/image-3.png)

### 1. Write a service that connects to the Differential control-plane

```ts
import { Differential } from "@differentialhq/core";

// You can get a token from
// - curl https://api.differential.dev/demo/token
// - self-hosting the control-plane: https://docs.differential.dev/advanced/self-hosting/
// - or by signing up for Differential Cloud: https://forms.fillout.com/t/9M1VhL8Wxyus
const d = new Differential("MY_API_SECRET");

// Write your business logic as if it were local

function sum(a: number, b: number) {
  return a + b;
}

function get(url: string) {
  // ...even functions with side effects
  return fetch(url).then((res) => res.json());
}

// Register your functions with the control-plane
const myService = d.service("my-service", {
  functions: {
    sum,
    get,
  },
});

// Start the service, and it will connect to the
// control-plane and listen for function calls from other places
myService.start();
```

### 2. Consume the service with full type safety from anywhere

```ts
import { Differential } from "@differentialhq/core";

// Import the types of the Differential service
import type { myService } from "./my-service";

// Initialize the Differential SDK with the same API secret
const d = new Differential("MY_API_SECRET");

// Create a client for the service.
// (Notice that you don't have to provide an endpoint. Clients talk to the control-plane)
const client = d.service<typeof myService>("my-service");

// call the remote functions as if they were local, with full type safety
client.sum(1, 2).then(console.log); // 3

client.get("https://api.differential.dev/live").then(console.log); // { status: "ok" }
```

## How can I get started?

1. [Build your first end-to-end Differential service in 2 minutes](https://docs.differential.dev/getting-started/quick-start/)
2. [Sign up for Differential Cloud](https://forms.fillout.com/t/9M1VhL8Wxyus) (managed version of Differential)
3. [Self-host Differential yourself](https://docs.differential.dev/advanced/self-hosting/)

## More Documentation

All documentation is hosted at [docs.differential.dev](https://docs.differential.dev). Here are some quick links to get you started:

- [Thinking in Differential](https://docs.differential.dev/getting-started/thinking/)
- [How it works under the hood](https://docs.differential.dev/advanced/how-things-work/architecture/)
- [Customizing Function Call Behavior](https://docs.differential.dev/getting-started/customizing-function-calls/)

# Differential Cloud

Differential Cloud is a managed version of Differential. It is currently in beta. You can sign up for the waitlist [here](https://forms.fillout.com/t/9M1VhL8Wxyus).

![](assets/differential-cloud.gif)
![](assets/differential-cloud-2.png)

# About this repo

This is a mono-repo for almost all of the Differential codebase. It contains the following repositories:

- [Control Plane](./control-plane/) The control plane is the central command & control for a differential cluster. This is fully open source and can be run on your own infrastructure. We also offer a hosted version of the control plane at [www.differential.dev](https://differential.dev).
- [Typescript SDK](./ts-core/) The Typescript SDK is the main way to interact with Differential. It is used to define, run and call services.
- [Admin Console](./admin) The admin console is a web-based UI for Differential. It is used to visualize the service registry, view logs, and more.
- [CLI](./cli) The CLI is a command-line interface for Differential. It is used to interact with the control plane, deploy services, and more.
- [Docs](https://docs.differential.dev) The docs are the main source of information for Differential. They are hosted at [/docs](./docs/).

# Contributing

We welcome contributions to Differential! Please see our [contributing guide](./CONTRIBUTING.md) for more information.
