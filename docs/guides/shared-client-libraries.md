# Building Shared Client Libraries for Services

Status: **Private Beta**

Differential supports publishing a client library for your cluster which can be included in a separate project using `npm`. Client libraries are distributed privately via a `node` package registry managed by Differential.

The [Differential CLI](https://github.com/differentialhq/differential/tree/main/cli) is used to manage client libraries, you can publish a new client library with the `client publish` command.

> Differential uses [semantic versioning](https://semver.org), as part of publishing the client library you will be asked to describe the change increment (`patch`, `minor`, `majod`).

```sh
differential auth login
differential client publish
```

Once published, the client can be installed in other projects as you would any other `node` package.

> The `differential auth login` CLI command configures the host's `~/.npmrc` configuration to authenticate with the Differential package registry. If you need to install the package from another host, run `npm auth login`.

```sh
npm i @differential.dev/<CLUSTER_NAME>
```

This will provide a type safe client which can be used to call any service in the cluster.

```typescript
import { d } from "../d";
import type { helloService } from "@differential.dev/<CLUSTER_NAME>";

const client = d.client<typeof helloService>("hello");
....
```

Shared client libraries are currently in private beta and will be available soon. To gain early access, please sign up for the waitlist [here](https://forms.fillout.com/t/9M1VhL8Wxyus).
