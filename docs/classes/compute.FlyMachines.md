[@differential-dev/sdk](../README.md) / [Exports](../modules.md) / [compute](../modules/compute.md) / FlyMachines

# Class: FlyMachines

[compute](../modules/compute.md).FlyMachines

## Table of contents

### Constructors

- [constructor](compute.FlyMachines.md#constructor)

### Methods

- [start](compute.FlyMachines.md#start)
- [stop](compute.FlyMachines.md#stop)

## Constructors

### constructor

• **new FlyMachines**(`params`): [`FlyMachines`](compute.FlyMachines.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `params` | `Object` |  |
| `params.apiSecret` | `string` | The API secret to control your app. Usually you can obtain this by running `flyctl auth token`. |
| `params.appName` | `string` | The name of the app you want to control. This must be the same as the name of the app you created on https://fly.io |
| `params.idleTimeout?` | `number` | The amount of time to wait before stopping a machined due to inactivity. Defaults to 10 seconds. |

#### Returns

[`FlyMachines`](compute.FlyMachines.md)

**`Example`**

```ts
const compute = new FlyMachines({
 appName: "my-app",
 apiSecret: "my-api-secret",
 idleTimeout: 60_000 // 1 minute
})
```

#### Defined in

[src/compute.ts:25](https://github.com/differential-dev/sdk-js/blob/b14c4df/src/compute.ts#L25)

## Methods

### start

▸ **start**(): `Promise`\<`void`\>

Starts all machines that are not already started.

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/compute.ts:32](https://github.com/differential-dev/sdk-js/blob/b14c4df/src/compute.ts#L32)

___

### stop

▸ **stop**(): `Promise`\<`void`\>

Stops all machines that are not already stopped.

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/compute.ts:73](https://github.com/differential-dev/sdk-js/blob/b14c4df/src/compute.ts#L73)
