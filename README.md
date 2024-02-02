<p align="center">
  <img src="https://cdn.differential.dev/logo.png" width="200" style="border-radius: 10px" />
</p>

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/differentialhq/differential/test-and-docs.yml) ![NPM Downloads](https://img.shields.io/npm/dm/%40differentialhq%2Fcore) ![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/%40differentialhq%2Fcore) ![GitHub Release](https://img.shields.io/github/v/release/differentialhq/differential) ![GitHub commit activity](https://img.shields.io/github/commit-activity/m/differentialhq/differential)

# Differential

Differential is an open-source "Durable RPC" framework for TypeScript. It uses a **centralised control-plane** and SDK that give superpowers to your remote function calls.

- Delightful DX: Write your remote calls as if they were local, with full type safety.
- Reliable: The control plane transparently handles network faults, machine restarts, retries across all your functions.
- Batteries Included: Comes with end-to-end encryption, observability, service registry, caching, and more.

![Alt text](assets/image-3.png)

## Differential in 60 seconds

### 1. Write a service that connects to the Differential control-plane

```ts
import { Differential, cached, idempotent } from "@differentialhq/core";

// You can get a token from
// - curl https://api.differential.dev/demo/token
// - self-hosting the control-plane: https://docs.differential.dev/advanced/self-hosting/
// - or by signing up for Differential Cloud: https://forms.fillout.com/t/9M1VhL8Wxyus
const d = new Differential("MY_API_SECRET");

// Write your business logic as if it were local

function sum(a: number, b: number) {
  return a + b;
}

function square(x: number) {
  return x * x;
}

function get(url: string) {
  // ...even functions with side effects
  return fetch(url).then((res) => res.json());
}

// Register your functions with the control-plane
const myService = d.service("my-service", {
  sum: sum,
  square: cached(square, { ttl: 60 }),
  get: idempotent(get),
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
const client = d.service<typeof myService>("my-service");

// call the remote functions as if they were local, with full type safety

client.sum(1, 2).then(console.log); // 3

client.square(3).then(console.log); // 9
client.square(3).then(console.log); // 9 -> Cached! Doesn't call till 60 seconds.

client.get("https://api.differential.dev/live").then(console.log); // { status: "ok" }
client.get("https://api.differential.dev/live").then(console.log); // { status: "ok" } -> Idempotent! Doesn't make a network request.
```

## Documentation

All documentation is hosted at [docs.differential.dev](https://docs.differential.dev). Here are some quick links to get you started:

- [Build your first end-to-end Differential service in 2 minutes](https://docs.differential.dev/getting-started/quick-start/)
- [Thinking in Differential](https://docs.differential.dev/getting-started/thinking/)
- [How it works under the hood](https://docs.differential.dev/advanced/architecture/)
- [Self-hosting](https://docs.differential.dev/advanced/self-hosting/)

# Features

- [x] [Open-Source Control Plane and Function Orchestration](https://github.com/differentialhq/differential/tree/main/control-plane)
- [x] [Stable Typescript SDK](https://docs.differential.dev/getting-started/quick-start/)
- [x] [Differential Cloud Beta](https://forms.fillout.com/t/9M1VhL8Wxyus)
- [x] [End-to-end Encryption](https://docs.differential.dev/advanced/advanced-usage/#end-to-end-encryption)
- [x] [Run functions idempotently](https://docs.differential.dev/advanced/advanced-usage/#idempotency)
- [x] [Observability and tracing at the function level](https://forms.fillout.com/t/9M1VhL8Wxyus)
- [x] [Service registry](https://forms.fillout.com/t/9M1VhL8Wxyus)
- [x] [Cache function results globally](https://docs.differential.dev/advanced/advanced-usage/#global-cache)
- [x] [Self-hosting on your own infrastructure](https://docs.differential.dev/advanced/self-hosting/)
- [ ] Per-function rate limiting
- [ ] One-line deployment to AWS Lambda
- [ ] AI-generated developer documentation
- [ ] Generate integration tests from telemetry data
- [ ] Managed API gateways for external access to your functions

...and more! Join our [Discord](https://discord.gg/WtZkXv74) to stay up to date.

# Differential Cloud

Differential Cloud is a managed version of Differential. It is currently in beta. You can sign up for the waitlist [here](https://forms.fillout.com/t/9M1VhL8Wxyus).

![](assets/differential-cloud.gif)
![](assets/differential-cloud-2.png)

# About this repo

This is a mono-repo for almost all of the Differential codebase. It contains the following repositories:

## Application

- [Control Plane](./control-plane/) The control plane is the central command & control for a differential cluster. This is fully open source and can be run on your own infrastructure. We also offer a hosted version of the control plane at [www.differential.dev](https://differential.dev).
- [Typescript SDK](./ts-core/) The Typescript SDK is the main way to interact with Differential. It is used to define, run and call services.
- [Admin Console](./admin) The admin console is a web-based UI for Differential. It is used to visualize the service registry, view logs, and more.

## Auxiliary

- [Docs](https://docs.differential.dev) The docs are the main source of information for Differential. They are hosted at [/docs](./docs/).
