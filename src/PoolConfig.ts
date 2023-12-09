/**
 * PoolConfig represents a configuration for a worker pool. A pool listens for work and executes them in the host compute environment.
 * @example Basic usage
 * ```ts
 * const config = new PoolConfig("background-worker");
 * ```
 * @example Using fly compute to scale in and out. See FlyMachines for more information.
 * ```ts
 * const config = new PoolConfig("email-worker", {
 *   idleTimeout: 10_000,
 *   onWork: () => {
 *     // Scale out
 *     flyMachinesInstance.start();
 *   },
 *   onIdle: () => {
 *     // Scale in
 *     flyMachinesInstance.stop();
 *   },
 * });
 * ```
 */
export class PoolConfig {
  private config: {
    name: string;
    idleTimeout?: number;
    onWork?: () => void;
    onIdle?: () => void;
  };

  /**
   * @param name Name of the pool
   * @param params Optional parameters
   * @param params.idleTimeout Time in milliseconds to wait before considering the pool idle
   * @param params.onWork Callback to be called when the pool has work to do. Useful for scaling out compute resources.
   * @param params.onIdle Callback to be called when the pool is idle and has no work to do. Useful for scaling in compute resources.
   */
  constructor(
    name: string,
    params?: {
      idleTimeout?: number;
      onWork?: () => void;
      onIdle?: () => void;
    }
  ) {
    // throw error if onIdle is provided without idleTimeout
    if (params?.onIdle && !params?.idleTimeout) {
      throw new Error(
        "idleTimeout must be provided if onIdle is provided as a parameter"
      );
    }

    this.config = {
      name,
      ...params,
    };
  }

  get name() {
    return this.config.name;
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
