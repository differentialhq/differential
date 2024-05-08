import debug from "debug";
import { serializeError } from "./serialize-error";
import { AsyncFunction } from "./types";

const log = debug("differential:client");

export type Result<T = unknown> = {
  content: T;
  type: "resolution" | "rejection";
  functionExecutionTime?: number;
};

export const executeFn = async (
  fn: AsyncFunction["func"],
  args: Parameters<AsyncFunction["func"]>,
): Promise<Result> => {
  const start = Date.now();
  try {
    const result = await fn(...args);

    return {
      content: result,
      type: "resolution",
      functionExecutionTime: Date.now() - start,
    };
  } catch (e) {
    const functionExecutionTime = Date.now() - start;
    if (e instanceof Error) {
      return {
        content: serializeError(e),
        type: "rejection",
        functionExecutionTime,
      };
    } else if (typeof e === "string") {
      return {
        content: serializeError(new Error(e)),
        type: "rejection",
        functionExecutionTime,
      };
    } else {
      return {
        content: new Error(
          "Differential encountered an unexpected error type. Make sure you are throwing an Error object.",
        ),
        type: "rejection",
        functionExecutionTime,
      };
    }
  }
};

export class TaskQueue {
  private tasks: Array<{
    fn: AsyncFunction["func"];
    args: Parameters<AsyncFunction["func"]>;
    resolve: (value: Result) => void;
  }> = [];

  addTask(
    fn: AsyncFunction["func"],
    args: Parameters<AsyncFunction["func"]>,
    resolve: (value: Result) => void,
  ) {
    this.tasks.push({
      fn,
      args,
      resolve,
    });

    this.run();
  }

  private run() {
    const tasks = this.tasks;
    this.tasks = [];

    Promise.all(
      tasks.map((task) => executeFn(task.fn, task.args).then(task.resolve)),
    );
  }

  async quit() {
    return new Promise<void>((resolve) => {
      if (this.tasks.length === 0) {
        resolve();
      } else {
        const interval = setInterval(() => {
          if (this.tasks.length === 0) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      }
    });
  }
}
