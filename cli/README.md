## Differential.dev CLI

## Installation

```bash
npm install -g @differentialhq/cli
```

## Usage

### Authenticating the CLI

To authenticate the CLI, run `differential auth login`.
This will open a browser and prompt you to login to the management console.

### Managing clusters

The `differential clusters` command contains subcommands for the management of clusters.
These include:

- `differential clusters create` Create a new Differential cluster
- `differential clusters list` List Differential clusters [aliases: ls]
- `differential clusters open` Open a Differential cluster in the console
- `differential clusters info` Display information about a Differential cluster

### Managing deployments

The `differential deploy` command contains subcommands for the management of Differential Cloud deployments.
These include:

- `differential deploy create` Create a new Differential service deployment
- `differential deploy list` List Differential cloud deployments [aliases: ls]
- `differential deploy info` Display information about a Differential cloud
  deployment
- `differential deploy logs` Retrieve logs for a service deployment

### Read Evaluate Print Loop (REPL)

`differential repl` will spawn an interactive NodeJS shell.
This shell is authenticated with your cluster and can be used to issue calls against it's functions.

### Managing the CLI context

The Differential CLI stores context in your project's directory.
Context allows you to persist options which can be omitted from future use of the CLI.

#### Setting context

Context values are set with `differential context set`.

The following command will set a `cluster` value in the context:

```
differential context set --cluster=my-favourite-cluster
```

Future calls can now omit the `--cluster` option.

The context value can be unset by providing an empty option value.

```
differential context set --cluster
```

#### Named contexts

The CLI can maintain multiple named contexts for your project.
This can be useful when working across multiple clusters, for example different environments.

To use a named context, provide the `--context` option with your command:

```
differential -context-=staging repl
```
