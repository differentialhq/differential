[@differential-dev/sdk](../README.md) / [Exports](../modules.md) / Differential

# Class: Differential

## Table of contents

### Constructors

- [constructor](Differential.md#constructor)

### Methods

- [background](Differential.md#background)
- [fn](Differential.md#fn)
- [listen](Differential.md#listen)
- [quit](Differential.md#quit)

## Constructors

### constructor

• **new Differential**(`apiSecret`, `listeners?`): [`Differential`](Differential.md)

Initializes a new Differential instance.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `apiSecret` | `string` | The API Secret for your Differential cluster. Obtain this from [your Differential dashboard](https://admin.differential.dev/dashboard). |
| `listeners?` | [`ListenerConfig`](ListenerConfig.md)[] | An array of listener configurations to use for listening for jobs. A listener listens for work and executes them in the host compute environment. |

#### Returns

[`Differential`](Differential.md)

**`Example`**

```ts
 const d = new Differential("API_SECRET", []);
```

**`Example`**

```ts
const d = new Differential("API_SECRET", [
  // background worker can keep running
  new ListenerConfig({
    machineType: "background-worker",
  }),
  // image processor should scale in and out when there's no work
  // because it's expensive to keep running
  new ListenerConfig({
    machineType: "image-processor",
    idleTimeout: 10_000,
    onWork: () => {
       flyMachinesInstance.start();
    },
    onIdle: () => {
      flyMachinesInstance.stop();
    },
  }),
]);
```

#### Defined in

[src/Differential.ts:324](https://github.com/differential-dev/sdk-js/blob/b14c4df/src/Differential.ts#L324)

## Methods

### background

▸ **background**\<`T`\>(`f`, `options?`): (...`args`: `Parameters`\<`T`\>) => `Promise`\<\{ `id`: `string`  }\>

Register a background function with Differential. The inner function will be executed asynchronously in the host compute environment. Good for set-and-forget functions.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends (...`args`: `Parameters`\<`T`\>) => `ReturnType`\<`T`\> |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `f` | `AssertPromiseReturnType`\<`T`\> | The function to register with Differential. Can be any async function. |
| `options?` | `Object` |  |
| `options.name?` | `string` | The name of the function. Defaults to the name of the function passed in, or a hash of the function if it is anonymous. Differential does a good job of uniquely identifying the function across different runtimes, as long as the source code is the same. Specifying the function name would be helpful if the source code between your nodes is somehow different, and you'd like to ensure that the same function is being executed. |
| `options.runOn?` | `string` | The machine type to run this function on. If not provided, the function will be run on any machine type. |

#### Returns

`fn`

A promise that resolves to the job ID of the job that was created.

▸ (`...args`): `Promise`\<\{ `id`: `string`  }\>

Register a background function with Differential. The inner function will be executed asynchronously in the host compute environment. Good for set-and-forget functions.

##### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `Parameters`\<`T`\> |

##### Returns

`Promise`\<\{ `id`: `string`  }\>

A promise that resolves to the job ID of the job that was created.

**`Example`**

```ts
const report = d.background(async (data: { userId: string }) => {
  await db.insert(data);
}, {
  runOn: "background-worker"
});
```

**`Example`**

```ts
const report = d.background(async (data: { userId: string }) => {
  await db.insert(data);
}, {
  runOn: "background-worker"
});
```

#### Defined in

[src/Differential.ts:542](https://github.com/differential-dev/sdk-js/blob/b14c4df/src/Differential.ts#L542)

___

### fn

▸ **fn**\<`T`\>(`f`, `options?`): `T`

Register a foreground function with Differential. The inner function will be executed in the host compute environment, and the result will be returned to the caller.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends (...`args`: `Parameters`\<`T`\>) => `ReturnType`\<`T`\> |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `f` | `AssertPromiseReturnType`\<`T`\> | The function to register with Differential. Can be any async function. |
| `options?` | `Object` |  |
| `options.name?` | `string` | The name of the function. Defaults to the name of the function passed in, or a hash of the function if it is anonymous. Differential does a good job of uniquely identifying the function across different runtimes, as long as the source code is the same. Specifying the function name would be helpful if the source code between your nodes is somehow different, and you'd like to ensure that the same function is being executed. |
| `options.runOn?` | `string` | The machine type to run this function on. If not provided, the function will be run on any machine type. |

#### Returns

`T`

A function that returns a promise that resolves to the result of the function.

**`Example`**

```ts
const processImage = d.fn(async (image: Buffer) => {
  const processedImage = await imageProcessor.process(image);
  return processedImage;
}, {
  runOn: "image-processor"
});
```

#### Defined in

[src/Differential.ts:452](https://github.com/differential-dev/sdk-js/blob/b14c4df/src/Differential.ts#L452)

___

### listen

▸ **listen**(`listenParams?`): `void`

Listens for jobs and executes them in the host compute environment. This method is non-blocking.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `listenParams?` | `Object` |  |
| `listenParams.asMachineType?` | `string` | The machine type to listen for jobs for. If not provided, all machine types will be listened for. |
| `listenParams.registerPaths?` | `string`[] | An array of paths to register for differential functions. Differential functions are functions that are registered with d.fn() or d.background(). This function will scan these paths for functions that are wrapped and register them with Differential. |

#### Returns

`void`

**`Example`**

```ts
d.listen();
```

**`Example`**

```ts
d.listen({
 asMachineType: "image-processor",
 registerPaths: ["./modules/image-processor/index"]
});
```

#### Defined in

[src/Differential.ts:358](https://github.com/differential-dev/sdk-js/blob/b14c4df/src/Differential.ts#L358)

___

### quit

▸ **quit**(): `Promise`\<`void`\>

Stops listening for jobs, and waits for all currently executing jobs to finish. Useful for a graceful shutdown.

#### Returns

`Promise`\<`void`\>

A promise that resolves when all currently executing jobs have finished.

**`Example`**

```ts
process.on("beforeExit", async () => {
  await d.quit();
  process.exit(0);
});
```

#### Defined in

[src/Differential.ts:415](https://github.com/differential-dev/sdk-js/blob/b14c4df/src/Differential.ts#L415)
