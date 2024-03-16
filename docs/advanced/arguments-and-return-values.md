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

## Safety

Differential adds a layer of safety by validating the data types of the function arguments and return values before serializing them. If the data types are not supported, Differential will throw an error `DifferentialError.INVALID_DATA_TYPE`. The peformance overhead of this validation is negligible. However, you can disable this behaviour by setting the `validate` option to `false`.
