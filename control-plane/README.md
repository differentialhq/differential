<p align="center">
  <img width="100" height="150" src="./media/logo.png">
</p>

## Overview

Differential helps developers convert their function calls into RPCs, without having to write a REST API or use a third-party RPC framework. It's a control plane that allows you to run your functions in separate processes, while keeping your code unified and co-located.

This means you can offload heavy workloads to separate processes, without spending the overhead to set up a service interface - among other things.

## What can I do with it?

Many things. But

Given two functions like `doWork` and `doHeavyLifting`:

```ts
// worker.ts

const doWork = (request) => {
  // do some work
  await doHeavyLifting(request)
}

const doHeavyLifting = (request) => {
  // do some heavy lifting
  // but better to do it in a separate process
}
```

...it allows you to execute `doHeavyLifting` in a separate process, while still keeping it in the same file as `doWork`:

```ts
// worker.ts

import { d } from "./diffential"

// literally the same function as before
const doWork = (request) => {
  // do some work
  await doHeavyLifting(request)
}

// this function now runs in a separate worker process
// called "heavy-lifting-worker", that you own
const doHeavyLifting = d.fn(async (request) => {
  // do some heavy liftingnn
  // but better to do it in a separate process
}, {
  pool: "heavy-lifting-worker"
})
```

## What's this repo?

This repo contains the source code for the Differential control plane. We're proudly open source, and we welcome contributions. This repo allows you to self-host your own Differential server, and fully compatible with the open source SDKs.

```mermaid
graph LR
    subgraph Differential Control Plane
        DS[Control Plane Service]
        DB[(Postgres)]
        DS -- connects to --> DB
    end

    subgraph User services
        DC1[User service 1]
        DC2[User service 2]
        DC3[User service 3]
        DC1 -- HTTP --> DS
        DC2 -- HTTP --> DS
        DC3 -- HTTP --> DS
    end
```

## You might also like:

### SDKs

- [Typescript](https://github.com/differentialHQ/sdk-js)

### Documentation

- [Differential Docs](https://docs.differential.dev)

## How do I self-host?

### Using Docker

The easiest way to self-host is to use our Docker image defined in this repo. To do so:

1. Clone this repo and build the docker image:
```sh
docker build -t differential .
```

2. Set the following environment variables:
```sh
DATABASE_URL=postgres://user:password@host:port/database
```

3. Run the docker image.
```sh
docker run -p 3000:3000 differential
```

### Using fly.io

This repo contains a [fly.toml](./fly.toml) file that allows you to deploy Differential to [fly.io](https://fly.io) using the Docker image defined in this repo. To do so:

1. Authenticate with fly.io:
```sh
flyctl auth login
```

2. Create a fly.io app:
```sh
flyctl apps create
```

3. Set the following environment variables:
```sh
flyctl secrets set DATABASE_URL=postgres://user:password@host:port/database
```

4. Deploy to fly.io:
```sh
flyctl deploy
```

## FAQ

### How do I generate a new migration?

```sh
DATABASE_SSL_DISABLED="true" DATABASE_URL="postgres://" npm run migrations
```