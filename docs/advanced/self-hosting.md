# Self-hosting

You can self-host the Differential control-plane using your own compute, as long as you can run a Docker container. Differential only requires a postgres database for persistence.

## Guide to self-hosting using fly.io

### Creating the fly app

1. Clone the repo:

```sh
git clone git@github.com:differentialhq/differential.git && cd differential/control-plane
```

2. Create a fly app, and note the app name:

```sh
fly apps create
```

3. Open the fly.toml file and replace `"differential-core"` with the app name you noted in the previous step.

4. Deploy to fly.io:

```sh
fly deploy --vm-cpu-kind "shared" --vm-cpus "1" --vm-memory "512"
```

5. You will need to set a secret to access to the management functions of the control-plane. We will save the secret to a `management-secret.txt` file for now. You can do this by running:

```sh
# MANAGEMENT_SECRET must start with "sk_management_" and contain at least 32 characters
MANAGEMENT_SECRET="sk_management_$(openssl rand -base64 32)"
echo "$MANAGEMENT_SECRET" > management-secret.txt
fly secrets set MANAGEMENT_SECRET="sk_management_$(openssl rand -base64 32)"
```

### Creating the postgres instance

1. Next, you will need to provision a postgres instance. You can use any postgres provider, but for this purpose, we will use fly postgres. Note the fly postgres app name when you create it.

```sh
fly postgres create
```

2. Attach the postgres instance to the fly app. This will set the DATABASE_URL environment variable in the fly app.

```sh
fly postgres attach <postgres app name from step 6>
```

### Creating your first cluster

1. Assuming the app is created and the postgres instance is attached, you can now create your first cluster. Assuming your app is exposed at `differential-core.fly.dev`, you can create a cluster by running:

```sh
curl -X POST -H "Authorization: Basic $(cat management-secret.txt)" -H "Content-Type: application/json" https://differential-core.fly.dev/clusters
```

2. Now, you can retrieve the cluster information by running:

```sh
curl -H "Authorization: Basic $(cat management-secret.txt)" https://differential-core.fly.dev/clusters
```

You will only need the `apiSecret` from the response.

### Connecting to the control-plane

To connect to the cluster, you need:

1. The Typescript SDK
2. The endpoint where the control-plane is hosted
3. The `apiSecret` from the previous step

When initializing the SDK, you will need to pass the `apiSecret` and the `endpoint` to the `Differential` class.

```ts
import { Differential } from "@differentialhq/core";

const differential = new Differential("MY_API_SECRET", {
  endpoint: "https://MY_CONTROL_PLANE_APP.fly.dev",
});
```

And that's it!
