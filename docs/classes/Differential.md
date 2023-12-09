# Class: Differential

The Differential client. Use this to register functions, and establish listeners to listen for function calls.
For most use cases, you should only need one Differential instance per process.

**`Example`**

```ts
 const d = new Differential("API_SECRET");
```

**`Example`**

```ts
const d = new Differential("API_SECRET", [
  // background worker can keep running
  new PoolConfig({
    pool: "background-worker",
  }),
  // image processor should scale in and out when there's no work
  // because it's expensive to keep running
  new PoolConfig({
    pool: "image-processor",
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
| `listeners?` | [`PoolConfig`](PoolConfig.md)[] | An array of listener configurations to use for listening for jobs. A listener listens for work and executes them in the host compute environment. |

#### Returns

[`Differential`](Differential.md)

#### Defined in

[src/Differential.ts:329](https://github.com/differential-dev/sdk-js/blob/9d50d52/src/Differential.ts#L329)

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
| `options.pool?` | `string` | The worker pool to run this function on. If not provided, the function will be run on any worker pool. |

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
  pool: "background-worker"
});
```

**`Example`**

```ts
const report = d.background(async (data: { userId: string }) => {
  await db.insert(data);
}, {
  pool: "background-worker"
});
```

#### Defined in

[src/Differential.ts:547](https://github.com/differential-dev/sdk-js/blob/9d50d52/src/Differential.ts#L547)

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
| `options.pool?` | `string` | The worker pool to run this function on. If not provided, the function will be run on any worker pool. |

#### Returns

`T`

A function that returns a promise that resolves to the result of the function.

**`Example`**

```ts
const processImage = d.fn(async (image: Buffer) => {
  const processedImage = await imageProcessor.process(image);
  return processedImage;
}, {
  pool: "image-processor"
});
```

#### Defined in

[src/Differential.ts:456](https://github.com/differential-dev/sdk-js/blob/9d50d52/src/Differential.ts#L456)

___

### listen

▸ **listen**(`listenParams?`): `void`

Listens for jobs and executes them in the host compute environment. This method is non-blocking.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `listenParams?` | `Object` |  |
| `listenParams.asPool?` | `string` | The worker pool to listen for jobs for. If not provided, all worker pools will be listened for. |

#### Returns

`void`

**`Example`**

```ts
d.listen();
```

**`Example`**

```ts
d.listen({
 asPool: "image-processor",
});
```

#### Defined in

[src/Differential.ts:361](https://github.com/differential-dev/sdk-js/blob/9d50d52/src/Differential.ts#L361)

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

[src/Differential.ts:419](https://github.com/differential-dev/sdk-js/blob/9d50d52/src/Differential.ts#L419)
