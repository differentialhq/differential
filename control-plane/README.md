<p align="center">
  <img height="150" src="https://cdn.differential.dev/logo.png">
</p>

## Overview

This repo contains the source code for the Differential control plane. Control plane acts as an application code aware service mesh, and a distributed orchestrator. It implements a few things on top of Postgres:

- Queue with exactly-once processing semantics
- Service & function registry
- Utilities for running functions in a distributed environment (caching, idempotency, etc)
- APIs for interacting with the control plane
- APIs for ingesting metrics and logs

See the [Documentation](https://docs.differential.dev) for more information.

## How do I self-host?

You can self-host the Differential control-plane using your own compute, as long as you can run a Docker container. Differential only requires a postgres database for persistence. See the detailed guide to self-hosting using fly.io [here](https://docs.differential.dev/advanced/self-hosting).

## Contributing

We welcome contributions to Differential! Please see the [Contributing Guide](../CONTRIBUTING.md) for more information.
