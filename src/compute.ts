import debug from "debug";
import { throttle } from "./util";

const log = debug("differential:compute");

/**
 * @beta
 * A class to control Fly Machines with Differential client.
 * Use this to start and stop machines when you have work with `onWork` and `onIdle` in the PoolConfig.
 * @example
 * ```ts
 * const compute = new FlyMachines({
 *   appName: "my-app",
 *   apiSecret: "my-api-secret", // obtain this by running `flyctl auth token`
 *   idleTimeout: 60_000 // 1 minute
 * })
 *
 * const emailWorker = new PoolConfig("email-worker", {
 *   idleTimeout: 60_000, // 1 minute
 *   onWork: async () => {
 *     await compute.start() // start a machine when there is work
 *   },
 *   onIdle: async () => {
 *     await compute.stop() // stop a machine when there is no work
 *   },
 * })
 *
 * // add the listener to the client
 * const d = new Differential({
 *   apiSecret: "my-api-secret",
 *   listeners: [emailWorker]
 * })
 * ```
 */
export class FlyMachines {
  /**
   *
   * @param params
   * @param params.appName The name of the app you want to control. This must be the same as the name of the app you created on https://fly.io
   * @param params.apiSecret The API secret to control your app. Usually you can obtain this by running `flyctl auth token`.
   * @param params.idleTimeout The amount of time to wait before stopping a machined due to inactivity. Defaults to 10 seconds.
   * @example
   * ```ts
   * const compute = new FlyMachines({
   *  appName: "my-app",
   *  apiSecret: "my-api-secret", // obtain this by running `flyctl auth token`
   *  idleTimeout: 60_000 // 1 minute
   * })
   * ```
   */
  constructor(
    private params: { appName: string; apiSecret: string; idleTimeout?: number }
  ) {}

  /**
   * Starts all machines that are not already started.
   */
  async start() {
    return this.startThrottled();
  }

  private startThrottled = throttle(async () => {
    const nonStartedMachines = await fetch(
      `https://api.machines.dev/v1/apps/${this.params.appName}/machines`,
      {
        headers: {
          Authorization: `Bearer ${this.params.apiSecret}`,
          "Content-Type": "application/json",
        },
      }
    )
      .then((res) => res.json())
      .then((res) =>
        res.filter(
          (machine: { id: string; name: string; state: string }) =>
            machine.state !== "started"
        )
      );

    for (const machine of nonStartedMachines) {
      await fetch(
        `https://api.machines.dev/v1/apps/${this.params.appName}/machines/${machine.id}/start`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.params.apiSecret}`,
            "Content-Type": "application/json",
          },
        }
      ).then(() => {
        log(`Started machine ${machine.name} with id ${machine.id}`);
      });
    }
  }, this.params.idleTimeout ?? 10_000)[0] as () => Promise<void>;

  /**
   * Stops all machines that are not already stopped.
   */
  async stop() {
    const startedMachines = await fetch(
      `https://api.machines.dev/v1/apps/${this.params.appName}/machines`,
      {
        headers: {
          Authorization: `Bearer ${this.params.apiSecret}`,
          "Content-Type": "application/json",
        },
      }
    )
      .then((res) => res.json())
      .then((res) =>
        res.filter(
          (machine: { id: string; name: string; state: string }) =>
            machine.state !== "stopped"
        )
      );

    for (const machine of startedMachines) {
      await fetch(
        `https://api.machines.dev/v1/apps/${this.params.appName}/machines/${machine.id}/stop`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.params.apiSecret}`,
            "Content-Type": "application/json",
          },
        }
      ).then(() => {
        log(`Stopped machine ${machine.name} with id ${machine.id}`);
      });
    }
  }
}
