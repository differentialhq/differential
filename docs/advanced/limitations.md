# Limitations

## Programming language

Differential only supports TypeScript until it gets to a stable release. We do plan to support other languages in the future, however we are intensely focused on creating the right abstractions for a single language first.

There's nothing preventing your from using Differential with JavaScript, however you will lose out on the type safety that Differential provides for your clients.

## Function arguments

Although your functions can perform any operation that the JavaScript runtime allows you to perform, there are some limitations on the arguments that you can pass to the functions.

Arguments must be JSON serializable. This means that you can pass strings, numbers, booleans, arrays, objects, and null. You cannot pass functions, promises, or other non-serializable objects.

The reason for this is that the arguments are serialised and msgpacked before being sent to the worker.

## Function return values

The return value of your function must also be JSON serializable. This means that you can return strings, numbers, booleans, arrays, objects, and null. You cannot return functions, promises, or other non-serializable objects.

The reason for this is the same as the above.