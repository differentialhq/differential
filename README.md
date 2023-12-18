<p align="center">
  <img src="https://cdn.differential.dev/logo.png" width="200" style="border-radius: 10px" />
</p>

# Differential

> Build and Connect production services **10x faster** with delightful DX!

Differential is a Service Orchestration Framework that enables developers to turn any function into a typesafe service, without spending additional effort on managing service contracts, network communication, service authentication or infrastructure configuration.

It is designed to allow your code to be written in a monolithic way, but deployed as a set of independent services, and currently has first class support for Typescript.

# Overview

This is a mono-repo for almost all of the Differential codebase. It contains the following repositories:

## Application

- [Control Plane](./control-plane/) The control plane is the central command & control for a differential cluster. This is fully open source and can be run on your own infrastructure without using the cloud offering.
- [Typescript SDK](./ts-core/) The Typescript SDK is the main way to interact with Differential. It is used to define services, call services, and run services.

## Auxiliary

- [Docs](./docs/) The docs are the main source of information for Differential. They are hosted at [docs.differential.dev](https://docs.differential.dev).
- [Changeset Builder](./changeset-builder/) A utility to help us manage changesets and packages across all of our packages.