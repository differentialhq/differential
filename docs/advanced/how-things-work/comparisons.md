# Comparisons

## Comparisons with HTTP / REST APIs

### Working with Data

Unlike REST APIs, with Differential, you don't need to cocern yourself with the HTTP status codes, serialization, or deserialization. Differential works with native data types, and provide type-safe interfaces for you to work with.

This prevents the developer from having to deal with the conversion overhead between programming constructs and HTTP constructs.

With differential, the equivalent code here:

```ts
// server.ts
const server = new HttpServer();
const userController = new UserController();

server.get("/users", (req, res) => {
  const users = userController.getUsers({
    searchQuery: req.query.searchQuery,
  });

  res.status(200).json({ users });
});

// client.ts
function getNames(users: User[]) {
  const result = await fetch("/users", {
    searchQuery: "John",
  });

  const data = await result.json();

  if (data.status === 200) {
    return data.users.map((user) => user.name);
  } else {
    throw new Error("Failed to get users");
  }
}
```

becomes:

```ts
// service.ts
const { d } = require("./d.ts");
const userController = new UserController();

export const userService = d.service("users", {
  functions: {
    getUsers: userController.getUsers,
  },
});

// client.ts
const client = d.client<typeof userService>("users"); // lightweight proxy

function getNames(users: User[]) {
  // this is fully type-safe
  const users = await client.getUsers({
    searchQuery: "John",
  });

  return users.map((user) => user.name);
}
```

### Working with Multiple Services

In a service-oriented architecture, you may have multiple services that you need to communicate with. These will be exposed as different REST APIs, and your clients will communicate with them in a m:m fashion.

With Differential, all your services and clients connect to a single cluster. Clients can access any service that connects to the cluster. How the connections are mapped out, can be traced via the source code without an additional layer of network that gets in the way.

Differential becomes your service gateway and an elegant service discovery mechanism.

### Exposure of Internal Functions

A traditional REST service will require you to implement authentication, so your clients have a trusted relationship with your server. This is usually done via a token-based authentication scheme, and middleware that checks for the token on every request. This is especially true if you can't trust the network that your clients are connecting from, such as outside of your VPC.

With Differential, your internal services are only exposed to the control-plane via a secure connection. This means that you don't need to implement authentication for your internal services, as they are not exposed to the outside world. Differential clients can only access the functions that you explicitly expose to them.

### Type Safety

Differential provides type-safe interfaces for your clients to interact with your services, without a compile step. This also means that you don't have to worry about intermediate representations like OpenAPI, and the overhead of maintaining them.

### Language Agnosticism

Differential is not language agnostic. If you need to connect two services written in different languages, you will need to implement a shim layer in Typescript, and connect them to the same cluster. Depending on your use case, this may be additional complexity that you don't need.

This is in stark contrast to something like a REST service that can publish a intermediary representation of its API, such as OpenAPI, and allow clients to generate code from it. This is a tradeoff that we have made, as we believe that the benefits of type safety outweigh the benefits of language agnosticism.

## Comparisons with gRPC / Protocol Buffers

### Working with Data

gRPC uses Protocol Buffers as its serialization format. This means that you need to define your data structures in a separate file, and compile them into your language of choice. This is an additional step that you need to perform, and build tooling towards.

Every change that is made to the data structures will require a recompilation of the data structures, and a redeployment of the service.

Differential uses native programming constructs, and does not require you to have a comparative `.proto` file or a complilation step. Compatibility of contracts is enforced by the type system. However, you do lose out on some of the gurantees that Protocol Buffers provides, such as backwards compatibility.

However, we do plan to support additional developer tooling that will optionally verify and protect against breaking changes in contracts.

### Serialization

Protocol Buffers uses its knowledge about the data structure to optimize the serialization, deserialization, and the message size over the wire. Differential does not have this knowledge, and uses msgpack (a binary serialization format) to serialize and deserialize data. This means that the message size over the wire will be typically larger than gRPC, but smaller than JSON.

### Other notes

The same notes that apply to REST APIs also apply to gRPC APIs for Working with Multiple Services, Exposure of Internal Functions, Type Safety, and Language Agnosticism.
