# Architecture

!!!
Differential is currently in technical preview. We've seen promising early results, but our architecture is still evolving. We welcome your thoughts on our design choices. Join the discussion on our [GitHub](https://github.com/differentialhq/differential).
!!!

Differential’s architecture is intentionally straightforward. We adhere to the principle that simplicity leads to easier scalability, self-hosting, and iterative improvements. Our focus is on refining simplicity to achieve the most effective abstractions.

## Key Components

- [Control Plane](#control-plane)
- [SDK](#sdk)

## Control Plane

The Control Plane functions as the nerve center, handling job management and API interactions. Each function call translates into a job, identified by its name and arguments. The Control Plane dynamically assigns jobs to clients, ensuring a single job isn't processed by multiple clients by atomically updating its state to "Running".

To prevent job stalling, the Control Plane monitors job durations, flagging any that exceed predefined limits as failed. These can be retried according to customizable policies. We use a relational database (compatible with Postgres, CockroachDB, etc.) for storing all job states, facilitating self-hosting.

## SDK

### Service-side

On initializing a service, the SDK registers with the Control Plane and begins polling for jobs. It maintains an in-memory function registry and a task queue. This task queue, whose concurrency level is adjustable, determines parallel function execution capacity.

For each job, the SDK identifies the corresponding function and executes it with the provided arguments. Results are then relayed back to the Control Plane.

### Client-side

The client-side of Differential involves invoking functions through a type-safe client established via the SDK. Function calls are serialized and sent to the Control Plane. The client then long-polls for the result, which, upon receipt, is deserialized for use.

In all operations, we use msgpack for its efficiency in serialization over formats like JSON.

## Considered Tradeoffs

1. **Long Polling**: We chose long polling over persistent connections like websockets for easier self-hosting and scalability of the Control Plane. This decision, while impacting performance, is under continuous evaluation.

2. **Database Selection**: Our choice of Postgres for job state storage offers rapid iteration and ease in self-hosting. It strikes a balance between performance and flexibility.

3. **Serialization with Msgpack**: Msgpack offers a compact binary format, favoring speed over the compression level achieved by schema-aware binary formats. This decision eliminates the need for intermediate language schemas for developers to maintain.

## Future Enhancements and Community Engagement

Differential is a collaborative, evolving project. We actively integrate community feedback into our development process. Future enhancements will focus on improving performance, scalability, and user experience based on real-world applications and user suggestions.

If you're planning to use Differential, we'd love to hear from you. Please reach out to us at [hello@differential.dev](mailto:hello@differential.dev) or join the discussion on our [GitHub](https://github.com/differentialhq/differential).
