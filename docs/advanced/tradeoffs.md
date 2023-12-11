---
order: 900
---

# Tradeoffs

## Least amount of cognitive overhead for the developer

We're very big on "nothing new to learn". The additional knowledge required to work with differential needs to be as close to 0 as possible, and we definitely don't want to burden the developer with additional mental models.

This however, does come at the expense of certain features that we could support and certain safety mechanisms such as strongly typed interfaces.

## Designed for rapid iteration over stronger contract guarantees

Differential helps you rapidly iterate and get to v1 faster.

This sometimes comes at the expense of stronger contract guarantees that RPC frameworks afford you. Most RPC frameworks do this by getting you to design a contract that a producer and a consumer have agreed to uphold.

However, in Differential, your function signature is the contract. The contract evolves and stays consistent because you have producer and consumer functions talking to each other in a unified codebase. This allows you to use types and tests to assert the behaviour.

## First class ergonomics around function execution over supporting all programming primitives

We believe that functions deserve first-class primitives for idempotency, debouncing, distributed result caching and fault tolerance.

We are here to make function execution more ergonomic, not merely distributed.

This might be a poor fit for programs that don't use functions as the leading primitive for controlling execution flow.

## Supporting a few use-cases really well over supporting every use-case

There are some type of applications that differential will be a poor fit for. 

The moment you execute a function over a network, it adds latency and additional failure modes.

Differential shines if your code is co-located, but you want to enjoy the benefits of distributed execution without the overhead of service interfaces or message passing.

In other words, we help monoliths scale like microservices. Differential is a poor fit if you're well on your way to the service-oriented architecture.