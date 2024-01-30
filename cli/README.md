## Differential.dev CLI

This is the official Differential CLI.

## Installation

### npm

```bash
npm install @differentialhq/cli
```

### yarn

```bash
yarn add @differentialhq/cli
```

### pnpm

```bash
pnpm add @differentialhq/cli
```

## Usage

### Deploying a service

Given a path to a TypeScript file describing a Differential service, the CLI will compile the service and deploy it to Differential.

Please note, the targeted cluster will need to have Differential cloud enabled.

````bash
DIFFERENTIAL_API_TOKEN=<API_TOKEN> differential deploy <PATH_TO_SERVICE> --service="<SEVICE_NAME>" --cluster="<CLUSTER_ID>" ```
````
