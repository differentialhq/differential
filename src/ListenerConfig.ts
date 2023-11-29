/**
 * ListenerConfig represents a configuration for a listener. A listener listens for work and executes them in the host compute environment.
 * @example Basic usage
 * ```ts
 * const config = new ListenerConfig({
 *  name: "background-worker",
 * });
 * ```
 * @example Using fly compute to scale in and out. See FlyMachines for more information.
 * ```ts
 * const config = new ListenerConfig({
 *   name: "email-worker",
 *   idleTimeout: 10_000,
 *   onWork: () => {
 *     // Scale out
 *     flyMachinesInstance.start();
 *    },
 *   onIdle: () => {
 *     // Scale in
 *     flyMachinesInstance.stop();
 *   },
 * });
 */
export class ListenerConfig {
  private config: {
    machineType: string;
    idleTimeout?: number;
    onWork?: () => void;
    onIdle?: () => void;
  };

  /**
   * @param name Name of the listener
   * @param params Listener configuration
   * @param params.idleTimeout Time in milliseconds to wait before considering the listener idle
   * @param params.onWork Callback to be called when the listener has work to do
   * @param params.onIdle Callback to be called when the listener is idle
   */
  constructor(
    machineType: string,
    params: {
      idleTimeout?: number;
      onWork?: () => void;
      onIdle?: () => void;
    }
  ) {
    // throw error if onIdle is provided without idleTimeout
    if (params.onIdle && !params.idleTimeout) {
      throw new Error(
        "idleTimeout must be provided if onIdle is provided as a parameter"
      );
    }

    this.config = {
      machineType,
      ...params,
    };
  }

  get machineType() {
    return this.config.machineType;
  }

  get idleTimeout() {
    return this.config.idleTimeout;
  }

  get onWork() {
    return this.config.onWork;
  }

  get onIdle() {
    return this.config.onIdle;
  }
}
