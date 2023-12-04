# Class: FlyMachines

A class to control Fly Machines with Differential client.
Use this to start and stop machines when you have work with `onWork` and `onIdle` in the ListenerConfig.

**`Example`**

```ts
const compute = new FlyMachines({
  appName: "my-app",
  apiSecret: "my-api-secret", // obtain this by running `flyctl auth token`
  idleTimeout: 60_000 // 1 minute
})

const emailWorker = new ListenerConfig({
  machineType: "email-worker",
  idleTimeout: 60_000, // 1 minute
  onWork: async () => {
    await compute.start() // start a machine when there is work
  },
  onIdle: async () => {
    await compute.stop() // stop a machine when there is no work
  },
})

// add the listener to the client
const d = new Differential({
  apiSecret: "my-api-secret",
  listeners: [emailWorker]
})
```

## Table of contents

### Constructors

- [constructor](FlyMachines.md#constructor)

### Methods

- [start](FlyMachines.md#start)
- [stop](FlyMachines.md#stop)

## Constructors

### constructor

• **new FlyMachines**(`params`): [`FlyMachines`](FlyMachines.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `params` | `Object` |  |
| `params.apiSecret` | `string` | The API secret to control your app. Usually you can obtain this by running `flyctl auth token`. |
| `params.appName` | `string` | The name of the app you want to control. This must be the same as the name of the app you created on https://fly.io |
| `params.idleTimeout?` | `number` | The amount of time to wait before stopping a machined due to inactivity. Defaults to 10 seconds. |

#### Returns

[`FlyMachines`](FlyMachines.md)

**`Example`**

```ts
const compute = new FlyMachines({
 appName: "my-app",
 apiSecret: "my-api-secret", // obtain this by running `flyctl auth token`
 idleTimeout: 60_000 // 1 minute
})
```

#### Defined in

[src/compute.ts:52](https://github.com/differential-dev/sdk-js/blob/9d50d52/src/compute.ts#L52)

## Methods

### start

▸ **start**(): `Promise`\<`void`\>

Starts all machines that are not already started.

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/compute.ts:59](https://github.com/differential-dev/sdk-js/blob/9d50d52/src/compute.ts#L59)

___

### stop

▸ **stop**(): `Promise`\<`void`\>

Stops all machines that are not already stopped.

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/compute.ts:100](https://github.com/differential-dev/sdk-js/blob/9d50d52/src/compute.ts#L100)
