# Monolith to Microservices and Back

A key value proposition of Differential is that it makes it easy to break up your monolith into services. This is a big deal, because breaking up a monolith is traditionally a very high overhead process. Differential makes it easy to break up your monolith into services, and to change the boundaries of your services as your business requirements change.

It also makes it easy to hit "Abort" and go back to a monolith if you need to.

## The Problem

You have a well-architected monolith. You've determined that it's time to break it up into 2 or more services. But the overhead of going for a service-oriented/microservices architecture is traditionally very high. You have to:

1. Figure out which functionality to break out into a service
2. Split up the code
3. Decide on a service communication protocol (HTTP, gRPC, tRPC, etc)
4. Copy paste boilerplate code for each service and/or write libraries to abstract away the boilerplate
5. Set up obervability / health checks / etc for each service
6. Write/move the business logic for each service
7. Write the service interfaces for each service (e.g. protobufs, OpenAPI, ts-rest/zod)
8. Document the interplay of services for other developers

This is a lot of work, and it's not even the fun part of building a product. If business requirements change and you need to change the boundaries of your services, you have to do it all over again.

### This leads many engineering teams to:

1. Delay breaking up their monoliths when it would be beneficial to do so, or...
2. Break it up early and suffer the consequences of a poorly architected services architecture.

## The Solution

Differential is an **application code aware service mesh, and a distributed orchestrator**. It is designed to:

1. Make it easy to break up your monolith into services
2. Make it easy to change the boundaries of your services as your business requirements change
3. Make it easy to hit "Abort" and go back to a monolith if you need to

| Problem                                                                                               | Solution                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Figure out which functionality to break out into a service.                                           | 👍 This is the highest-value problem worth solving. Differential helps you focus on this problem.                                                                              |
| Split up the codebase                                                                                 | ✅ With Differential, you don't have to split up your codebase.                                                                                                                |
| Decide on a service communication protocol (HTTP, gRPC, tRPC, etc.).                                  | ✅ Differential abstracts this away from you, unless you want to look under the hood. It uses HTTP.                                                                            |
| Copy/Paste boilerplate code for each service and/or write libraries to abstract away the boilerplate. | ✅ Differential provides you with the tools to keep your code co-located, but deployable as independent services at runtime.                                                   |
| Set up observability / health checks / monitoring for each service.                                   | ✅ Differential comes with a dev console which gives you full observability down to the function level. You can see errors, detailed logs and execution times with zero-setup. |
| Write/move business logic for each service.                                                           | ✅ Differential services are simply javascript objects that define which functions (a.k.a business logic) belong to which service.                                             |
| Write the service interfaces for each service (e.g. protobufs, OpenAPI, ts-rest/zod).                 | ✅ Differential infers your service interface from your function types. Your services become end-to-end typesafe. There's no need for another interchange format.              |
| Document the interplay of services for other developers.                                              | ✅ Differential's dev console gives you a full view of your service registry, which functions are registered, and the live status for each.                                    |
