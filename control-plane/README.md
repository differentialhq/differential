<p align="center">
  <img height="150" src="https://cdn.differential.dev/logo.png">
</p>

## Overview

This repo contains the source code for the Differential control plane. Control plane acts as an application code aware service mesh, and a distributed orchestrator. It implements a few things on top of Postgres and InfluxDB:

- Queue with exactly-once processing semantics
- Service & function registry
- Utilities for running functions in a distributed environment (caching, idempotency, etc)
- APIs for interacting with the control plane
- APIs for ingesting metrics and logs

See the [Documentation](https://docs.differential.dev) for more information.

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

## Contributing

We welcome contributions to Differential! Please see the [Contributing Guide](../CONTRIBUTING.md) for more information.
