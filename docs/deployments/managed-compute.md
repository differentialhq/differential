# Managed Compute (BETA)

> Managed compute is currently in private beta. To gain early access, please reach out [here](mailto:hello@differential.dev)

Status: **BETA**

Managed compute is Differential's hosted compute offering that runs your Differential services.

The control-plane has the knowledge of how many function calls are being made and how frequently, it can use this information to spin up a service on-demand and scale it down when it's not being used.

Differential will provision additional instances of your service as the backlog of pending jobs increases.

A single service session is used to execute multiple function calls, reducing the frequency of cold starts and services are kept warm for a period of time after each function call is handled.

## Programming model

Differential deployments are run on AWS Lambda and the [same considerations apply](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html) with the exception that the same invocation will be used for handling multiple jobs.

## Limitations

> During the beta period, Differential managed compute will place some limitation on services, these will be removed / configurable in the future.

- Differential deployed services run in an x86 environment with a total of 128mb of memory available.
- Individual services are limited to 10 concurrent instances (each instance will handle multiple jobs, but this is the upper limit on concurrent execution environments).
- The total allotted execution time is 60 seconds, jobs longer than this will _not_ complete successfully.

## Create a deployment

Differential deployments are created with the `differential deploy create` command (See the [CLI readme](https://github.com/differentialhq/differential/blob/main/cli/README.md) for more details).

If options (service, cluster) are not provided explicitly, the CLI will prompt for these based on the eligible services in the project's source code.

### Entry point

By default, the `main` key specified in the project's `package.json` will be used as the compilation entry point.

To be eligible for deployment, A service must be either:

- exported by the entry point
- imported by the entry point, directly or indirectly

You can specify an explicit entry point with `--entrypoint`.

```bash
# Will search the project for all available services, based on `package.json#main`
differential deploy create

# Explit entry point
differential deploy create --entrypoint="./src/my-target-service.ts`
```

### Project building and module exports

When creating a deployment, differential will build your project with `tsc`.

Differential will evaluate your project's source code, finding all services available for deployment.

> Currently, only [default ES module exports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export) are evaluated.

For example, the following service definition would be considered for deployment:

```typescript
export default d.service({
  name: "hello",
  functions: {
    hello,
  },
});
```

## View deployment logs

Any `stdout` / `stderr` produced by a deployment is persisted and can be viewed with the `differential deploy logs` command.
Logs are limited to the last 1000 events.

### Log filtering

Logs can be filtered based on a pattern with the `--filter` option.

```bash
differential logs --filter="ERROR"

# Logs can be exluded by prefixing the pattern with '-'
differential logs --filter="-Responding to request"
```
