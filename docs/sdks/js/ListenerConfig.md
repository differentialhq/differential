# Class: PoolConfig

PoolConfig represents a configuration for a listener. A listener listens for work and executes them in the host compute environment.

**`Example`**

```ts
const config = new PoolConfig({
  name: "background-worker",
});
```

**`Example`**

```ts
const config = new PoolConfig({
  name: "email-worker",
  idleTimeout: 10_000,
  onWork: () => {
    // Scale out
    flyMachinesInstance.start();
  },
  onIdle: () => {
    // Scale in
    flyMachinesInstance.stop();
  },
});
```

## Table of contents

### Constructors

- [constructor](PoolConfig.md#constructor)

### Accessors

- [idleTimeout](PoolConfig.md#idletimeout)
- [pool](PoolConfig.md#machinetype)
- [onIdle](PoolConfig.md#onidle)
- [onWork](PoolConfig.md#onwork)

## Constructors

### constructor

• **new PoolConfig**(`pool`, `params`): [`PoolConfig`](PoolConfig.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `pool` | `string` | - |
| `params` | `Object` | Listener configuration |
| `params.idleTimeout?` | `number` | Time in milliseconds to wait before considering the listener idle |
| `params.onIdle?` | () => `void` | Callback to be called when the listener is idle and has no work to do. Useful for scaling in compute resources. |
| `params.onWork?` | () => `void` | Callback to be called when the listener has work to do. Useful for scaling out compute resources. |

#### Returns

[`PoolConfig`](PoolConfig.md)

#### Defined in

[src/PoolConfig.ts:40](https://github.com/differential-dev/sdk-js/blob/9d50d52/src/PoolConfig.ts#L40)

## Accessors

### idleTimeout

• `get` **idleTimeout**(): `undefined` \| `number`

#### Returns

`undefined` \| `number`

#### Defined in

[src/PoolConfig.ts:65](https://github.com/differential-dev/sdk-js/blob/9d50d52/src/PoolConfig.ts#L65)

___

### pool

• `get` **pool**(): `string`

#### Returns

`string`

#### Defined in

[src/PoolConfig.ts:61](https://github.com/differential-dev/sdk-js/blob/9d50d52/src/PoolConfig.ts#L61)

___

### onIdle

• `get` **onIdle**(): `undefined` \| () => `void`

#### Returns

`undefined` \| () => `void`

#### Defined in

[src/PoolConfig.ts:73](https://github.com/differential-dev/sdk-js/blob/9d50d52/src/PoolConfig.ts#L73)

___

### onWork

• `get` **onWork**(): `undefined` \| () => `void`

#### Returns

`undefined` \| () => `void`

#### Defined in

[src/PoolConfig.ts:69](https://github.com/differential-dev/sdk-js/blob/9d50d52/src/PoolConfig.ts#L69)
