# Class: ListenerConfig

ListenerConfig represents a configuration for a listener. A listener listens for work and executes them in the host compute environment.

**`Example`**

```ts
const config = new ListenerConfig({
  name: "background-worker",
});
```

**`Example`**

```ts
const config = new ListenerConfig({
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

- [constructor](ListenerConfig.md#constructor)

### Accessors

- [idleTimeout](ListenerConfig.md#idletimeout)
- [machineType](ListenerConfig.md#machinetype)
- [onIdle](ListenerConfig.md#onidle)
- [onWork](ListenerConfig.md#onwork)

## Constructors

### constructor

• **new ListenerConfig**(`machineType`, `params`): [`ListenerConfig`](ListenerConfig.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `machineType` | `string` | - |
| `params` | `Object` | Listener configuration |
| `params.idleTimeout?` | `number` | Time in milliseconds to wait before considering the listener idle |
| `params.onIdle?` | () => `void` | Callback to be called when the listener is idle and has no work to do. Useful for scaling in compute resources. |
| `params.onWork?` | () => `void` | Callback to be called when the listener has work to do. Useful for scaling out compute resources. |

#### Returns

[`ListenerConfig`](ListenerConfig.md)

#### Defined in

[src/ListenerConfig.ts:40](https://github.com/differential-dev/sdk-js/blob/9d50d52/src/ListenerConfig.ts#L40)

## Accessors

### idleTimeout

• `get` **idleTimeout**(): `undefined` \| `number`

#### Returns

`undefined` \| `number`

#### Defined in

[src/ListenerConfig.ts:65](https://github.com/differential-dev/sdk-js/blob/9d50d52/src/ListenerConfig.ts#L65)

___

### machineType

• `get` **machineType**(): `string`

#### Returns

`string`

#### Defined in

[src/ListenerConfig.ts:61](https://github.com/differential-dev/sdk-js/blob/9d50d52/src/ListenerConfig.ts#L61)

___

### onIdle

• `get` **onIdle**(): `undefined` \| () => `void`

#### Returns

`undefined` \| () => `void`

#### Defined in

[src/ListenerConfig.ts:73](https://github.com/differential-dev/sdk-js/blob/9d50d52/src/ListenerConfig.ts#L73)

___

### onWork

• `get` **onWork**(): `undefined` \| () => `void`

#### Returns

`undefined` \| () => `void`

#### Defined in

[src/ListenerConfig.ts:69](https://github.com/differential-dev/sdk-js/blob/9d50d52/src/ListenerConfig.ts#L69)
