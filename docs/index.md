---
order: 1500
icon: home
expanded: true
---

# Differential

!!!
Differential is in the technical preview stage, and is open-source. We are working hard to make our cloud offering generally available. Sign up for the waitlist [here](https://forms.fillout.com/t/9M1VhL8Wxyus).
!!!

Differential is an open-source "Durable RPC" framework for TypeScript. It uses a **centralised control-plane** and SDK that give superpowers to your remote function calls.

- Delightful DX: Write your remote calls as if they were local, with full type safety.
- Reliable: The control plane transparently handles network faults, machine restarts, retries across all your functions.
- Batteries Included: Comes with end-to-end encryption, observability, service registry, caching, and more.
- Open Source and Self-Hostable: Differential is fully open-source and can be self-hosted.

## Developer Experience

Differential doesn't invert your programming paradigm. If you know how to write functions, and call them, you already know how to use Differential. A collection of functions is called a service, and services come with lightweight, fully-typesafe clients that you can use to call them from anywhere.

## Reliable

A lot can go wrong when you're making remote calls. Differential transparently handles network faults, machine restarts, retries, and more. Because each function call is persisted to a log in the control-plane, you can be sure that your calls will be processed exactly once, even if the machine crashes.

## Batteries Included

Differential comes with end-to-end encryption, observability, service registry, caching, and more without any extra configuration. You just write your functions, and decorate them with the features you need.

## Open Source and Self-Hostable

Differential is released under the Apache 2.0 license, and can be self-hosted. This means you can run your own control-plane, and have full control over your data and infrastructure. Optionally, you can use Differential Cloud, which is a fully managed offering that we are working hard to make generally available. Sign up for the waitlist [here](https://forms.fillout.com/t/9M1VhL8Wxyus).

## See Also:

- [Get up and running with Differential in under 2 minutes](https://docs.differential.dev/getting-started/quick-start/)
- [Thinking in Differential](https://docs.differential.dev/getting-started/thinking/)
