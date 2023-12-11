---
order: 1100
---

# How it works

The core implementation of Differential is relatively simple.

## Orchestrating the functions over the network

Each time you wrap function with fn or background, the function gets registered in the local instance of the differential client, with a unique fingerprint.

Each local instance communicates with a central command and control server (C&C) at api.differential.dev (or something else if you're self-hosting).

Whenever a function is called, C&C disseminates that information to all the clients connected in the cluster, taking great care to not hand off the same work twice to two or more different clients. This way, differential exhibits at most once semantics.

The client that receives the function executes the function, and hands off the result (either a resolve Promise or a rejection) to the C&C, which will disseminate that information to the caller. In an event where the client cannot find the function registered within its runtime, it will return an error.

Throughout this whole process, caller and callee remain native Javascript / Typescript functions and are agnostic to the fact that they are executing the functions / being executed over the network.

## Uniquely fingerprinting the functions

The fingerprinting process is relatively simple. We take the function's source code, and we hash it. This way, we can uniquely identify the function, and we can also verify that the function has not been tampered with.

If the function source code changes, the fingerprint will change, and the calls that referred to the old fingerprint will no longer be valid. For this reason, whenever function source code needs to change, you should do it in a backwards compatible way, and keep the old function around for a while.

But in instances where you don't really care about the backwards compatibility, you can just delete the old function and create a new one with the same name.

### Overriding the fingerprint and the migration process

Naming the fucntion using the `name` parameter will override the hash, and the function will be registered with the name you provided instead of the hash. This is useful when you want to override the aforementioned backwards compatibility, and handle the migration yourself.