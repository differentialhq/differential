# Recovering from machine failures

Status: **General Availability**

In a cloud environment, machines can fail at any time. Differential transparently handles machine failures, and retries the operation on a healthy worker. This means that you don't have to worry about your service being unavailable due to a machine failure.

Machines periodically send heartbeats to the control-plane. If a machine fails to send any heartbeats within a certain interval (default 90 seconds):

1. It is marked as unhealthy, and Differential will not send any new requests to it.
2. The functions in progress are marked as failed, and Differential will retry them on a healthy worker.

If the machine comes back online, Differential will mark it as healthy, and start sending new requests to it. However, it will disregard any results from the machine for the functions that were marked as failed.

```mermaidjs
sequenceDiagram
    participant ControlPlane as Control Plane
    participant UnhealthyMachine as Unhealthy Machine
    participant HealthyMachine as Healthy Machine

    Note over UnhealthyMachine,ControlPlane: Periodic Heartbeat Check
    UnhealthyMachine->>+ControlPlane: Send Heartbeat (Fail)
    ControlPlane->>-UnhealthyMachine: Mark as Unhealthy
    Note over UnhealthyMachine: No new requests received

    ControlPlane->>+HealthyMachine: Redirect New Requests
    Note over HealthyMachine: Continues receiving tasks

    UnhealthyMachine->>+ControlPlane: Attempt to Reconnect
    alt Reconnection Successful
        ControlPlane->>UnhealthyMachine: Mark as Healthy
        Note over UnhealthyMachine: Can now receive new requests
    else Reconnection Failed
        ControlPlane->>UnhealthyMachine: Keep as Unhealthy
        Note over UnhealthyMachine: No new requests
    end

    Note over UnhealthyMachine, HealthyMachine: Handling Failed Tasks
    ControlPlane->>HealthyMachine: Retry Failed Tasks from Unhealthy Machine
    Note over HealthyMachine: Executes retried tasks
```

However, it's possible that the particular workload that you're executing on the machine is what makes it crash. To account for this, there's a retry limit for any function call that results in a machine stall (default 2 times). If the function fails more than the retry limit, Differential will mark the function as permanently failed.
