---
order: 1500
---

# Differential

Differential transforms your internal functions into secure RPC endpoints, streamlining app and service integration without requiring separate service contracts or deployments. This approach fosters a unified codebase, akin to a monolithic architecture, while granting the flexibility to activate specific functions as needed and deactivate others at runtime.

This model offers the ease of maintaining a cohesive codebase without the typical drawbacks of such an approach, such as complications arising from executing worker code within an API server. Differential orchestrates these functions through a centralized server. This allows you to leverage the benefits of a unified codebase while enjoying the efficiency and security of distributed execution.

Your get the developer experience of maintaining co-located code, without the downfalls of co-located execution (e.g. like worker code running in a API server).

Orchestration is done via a central server, however - it supports end to end encryption so you can trust that Differential can't read your data.