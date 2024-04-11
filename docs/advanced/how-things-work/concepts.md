---
order: 1400
---

# Concepts

## Control Plane

A central book-keeping stateful service that keeps track of all the services that are running, and their health. It acts as a service registry, and a service mesh. Backed by a database, and deployed with multiple replicas. The managed control plane that Differential runs can be accessed at https://console.differential.dev.

## Cluster

A collection of services and workers. All services and workers connect to the control plane via a cluster.

```bash
$ differential clusters create
Cluster created successfully
{
  id: 'cluster-aged-paper-cb2142f716',
  apiSecret: 'sk_my_super_secret'
}
```

## Service

A collection of functions that can be called by a consumer using the differential client. Defined using the SDK.

```typescript
const d = new Differential("sk_my_super_secret");

export const myService = d.service({
  name: "myService",
  functions: async function echo(value: string) {
    return value;
  },
});
```

## Machine

A computer that runs one or more services. For a machine to identify itself with the control plane, at least one service must be started.

```typescript
await myService.start();
```

## Client

A type-safe entrypoint to your services.

```typescript
const d = new Differential("sk_my_super_secret");

const client = d.client<typeof myService>("myService");

await d.echo("hello"); // hello
```
