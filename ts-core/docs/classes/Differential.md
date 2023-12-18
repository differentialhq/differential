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
- [call](Differential.md#call)
- [service](Differential.md#service)

## Constructors

### constructor

• **new Differential**(`apiSecret`): [`Differential`](Differential.md)

Initializes a new Differential instance.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `apiSecret` | `string` | The API Secret for your Differential cluster. Obtain this from [your Differential dashboard](https://admin.differential.dev/dashboard). |

#### Returns

[`Differential`](Differential.md)

#### Defined in

[src/Differential.ts:388](https://github.com/differentialHQ/differential/blob/27394f4/ts-core/src/Differential.ts#L388)

## Methods

### background

▸ **background**\<`T`, `U`\>(`fn`, `...args`): `Promise`\<\{ `id`: `string`  }\>

Calls a function on a registered service, while ensuring the type safety of the function call through generics.
Returns the job id of the function call, and doesn't wait for the function to complete.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `RegisteredService` |
| `U` | extends `string` \| `number` \| `symbol` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | `U` | The function name to call. |
| `...args` | `Parameters`\<`T`[``"definition"``][``"functions"``][`U`]\> | The arguments to pass to the function. |

#### Returns

`Promise`\<\{ `id`: `string`  }\>

The job id of the function call.

**`Example`**

```ts
import { d } from "./differential";

const result = await d.background<typeof helloService, "hello">("hello", "world");

console.log(result.id); //
```

#### Defined in

[src/Differential.ts:590](https://github.com/differentialHQ/differential/blob/27394f4/ts-core/src/Differential.ts#L590)

___

### call

▸ **call**\<`T`, `U`\>(`fn`, `...args`): `Promise`\<`ReturnType`\<`T`[``"definition"``][``"functions"``][`U`]\>\>

Calls a function on a registered service, while ensuring the type safety of the function call through generics.
Waits for the function to complete before returning, and returns the result of the function call.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `RegisteredService` |
| `U` | extends `string` \| `number` \| `symbol` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | `U` | The function name to call. |
| `...args` | `Parameters`\<`T`[``"definition"``][``"functions"``][`U`]\> | The arguments to pass to the function. |

#### Returns

`Promise`\<`ReturnType`\<`T`[``"definition"``][``"functions"``][`U`]\>\>

The return value of the function.

**`Example`**

```ts
import { d } from "./differential";
import { helloService } from "./hello-service";

const result = await d.call<typeof helloService, "hello">("hello", "world");

console.log(result); // "Hello world"
```

#### Defined in

[src/Differential.ts:547](https://github.com/differentialHQ/differential/blob/27394f4/ts-core/src/Differential.ts#L547)

___

### service

▸ **service**\<`T`\>(`service`): `RegisteredService`

Registers a service with Differential. This will register all functions on the service.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `ServiceDefinition` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `service` | `T` | The service definition. |

#### Returns

`RegisteredService`

A registered service instance.

**`Example`**

```ts
const d = new Differential("API_SECRET");

const service = d.service({
  name: "my-service",
  functions: {
    hello: async (name: string) => {
      return `Hello ${name}`;
   }
});

// start the service
await service.start();

// stop the service on shutdown
process.on("beforeExit", async () => {
  await service.stop();
});
```

#### Defined in

[src/Differential.ts:509](https://github.com/differentialHQ/differential/blob/27394f4/ts-core/src/Differential.ts#L509)
