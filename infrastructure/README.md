# Differential Infrastructure

This directory provides infrastructure as code definitions for additional infrastructure resources used by Differential.
For more details on self-hosing, please see [our guide](https://docs.differential.dev/advanced/self-hosting).

## AWS CloudFormation

The `./cfn.yaml` file describes an [AWS CloudFormation](https://aws.amazon.com/cloudformation/) stack providing resources for:

- Client library registry
- Lambda deployments

### Creating stack initially

The stack can be provisioned by running the following command in your shell:

```sh
aws cloudformation create-stack \
    --stack-name $STACK_NAME \
    --template-body file://cfn.yaml \
    --parameters \
    ParameterKey=AssetUploadBucketName,ParameterValue=${ASSET_BUCKET_NAME} \
    ParameterKey=CfnTemplateBucketName,ParameterValue=${CFN_BUCKET_NAME} \
    ParameterKey=CfnSNSWebhook,ParameterValue=${CFN_WEBHOOK} \
    --capabilities CAPABILITY_NAMED_IAM CAPABILITY_IAM
```

### Updating the stack

Over time, new resources may be requried, changes can be applied to the stack by running the following command in your shell:

```sh
aws cloudformation update-stack \
    --stack-name $STACK_NAME \
    --template-body file://cfn.yaml \
    --parameters ParameterKey=AssetUploadBucketName,ParameterValue=${ASSET_BUCKET_NAME} \
    ParameterKey=CfnTemplateBucketName,ParameterValue=${CFN_BUCKET_NAME} \
    ParameterKey=CloudFormationWebhook,ParameterValue=${CFN_WEBHOOK} \
    --capabilities CAPABILITY_NAMED_IAM CAPABILITY_IAM
```
