# Argument and return values

One benefit of using Differential is that is abstracts away many of the complexities of network and data serialization. However, as with any abstraction - it is optimised for the most common use-cases and leaks some of the underlying complexity in the form of limitations.

Differential serializes function arguments and return values with the same algorithm, so the limitations are the same for both.

## Serializability

Differential uses Message Pack for serializing function arguments and return values. It serializes the actual values, not the references to the values. Therefore, if your function arguments or return values contain references to objects, they will not be serialized correctly.

## Data Type Compatibility

This is a table of data types and their compatibility with Differential as validated by the test suite:

| Data Type   | Supported |
| ----------- | --------- |
| `undefined` | ✅        |
| `null`      | ✅        |
| `boolean`   | ✅        |
| `number`    | ✅        |
| `string`    | ✅        |
| `bigint`    | ✅        |
| `object`    | ✅        |
| `Array`     | ✅        |
| `Buffer`    | ✅        |
| `Date`      | ✅        |

## Advanced Data Types

It is theoretically possible to pass more complex data types such as `Map`, `Set`, `TypedArray`, `Error`, `RegExp`, `Function`, `Promise`, `Symbol`, `WeakMap`, `WeakSet`, `ArrayBuffer`, `SharedArrayBuffer`, `DataView`, `Int8Array`, `Uint8Array` etc, as long as they are not nested and do not contain references to objects. However, they go through a serialization process that requires extra work to be properly deserialized on the other side.

For this purpose, they are left out of the initial offering.

## Type-safety

Differential client warns you if you try to call a function with arguments that are not correctly transportable by enforcing that all service function arguments and return values should adhere to containing the data types listed in the table above.
