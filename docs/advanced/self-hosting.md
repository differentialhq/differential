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
fly secrets set MANAGEMENT_SECRET="$MANAGEMENT_SECRET"
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

## Additional infrastructure resources

Some Differential features require additional infrastructure resources, these include:

- Client library registry
- Cloud deployments

In order to take advantage of these features, you will need to provision the associated resources and provide the control-plane with access.

### Previsioning CloudFormation resources

Infrastructure as code (IaC) definitions for all additional resources, as well as instructions for provisioning them reside in [./infrastructure](https://github.com/differentialhq/differential/tree/main/infrastructure).

### Providing the control-plane with AWS access

The stack created in the previous step, provisions an [IAM User](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users.html) with the name `DifferentialControlPlane` that has [IAM](https://aws.amazon.com/iam/) permissions to interact with resources hosted in AWS.

Create an Access Key using the AWS CLI's [create-access-key](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/iam/create-access-key.html) command which can be used by the control-plane.

1. Create the access key for `DifferentialControlPlane`

```sh
aws iam create-access-key --user-name DifferentialControlPlane
```

2. Take note of the `AccessKeyId` and `SecretAccessKey`

```json
{
  "AccessKey": {
    "UserName": "DifferentialControlPlane",
    "AccessKeyId": "xxxxxxxxxxxxxxxxxxxx",
    "Status": "Active",
    "SecretAccessKey": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "CreateDate": "2024-00-00T00:00:00+00:00"
  }
}
```

3. Add the `AccessKeyId` and `SecretAccessKey` as [Fly.io secrets](https://fly.io/docs/reference/secrets/)

```sh
# From wihin `./control-plane`
fly secrets set AWS_ACCESS_KEY_ID=xxx
fly secrets set AWS_SECRET_ACCESS_KEY=xxx
```

### Providing the control-plane with resource references

The following environment variables will need to be made available to the control-plane:

- `ASSET_UPLOAD_BUCKET`
- `DEPLOYMENT_TEMPLATE_BUCKET`
- `DEPLOYMENT_SNS_TOPIC`
- `DEPLOYMENT_DEFAULT_SERVICE_ROLE`

Values for these can be retrieved from the previously created CloudFormation stack:

```
aws cloudformation describe-stacks --stack-name <STACK_NAME> --query "Stacks[0].Outputs"
```

These can either be hard-coded in the control-plane's `fly.toml` or set as secrets using `fly secrets set`.

### Upload deployment templates

The control-plane retrieves template files from the `DEPLOYMENT_TEMPLATE_BUCKET` S3 bucket in order to create deployments.

Upload the contents of `./infrastructure/deployment-templates/` to the `DEPLOYMENT_TEMPLATE_BUCKET` provisioned earlier.

```
cd ./infrastructure/deployment-templates/
aws s3 sync --exclude ".*" ./ s3://<DEPLOYMENT_TEMPLATE_BUCKET>
```
