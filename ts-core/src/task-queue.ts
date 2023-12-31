import debug from "debug";
import { serializeError } from "./serialize-error";
import { AsyncFunction } from "./types";

const log = debug("differential:client");

export type Result<T = unknown> = {
  content: T;
  type: "resolution" | "rejection";
  functionExecutionTime?: number;
};

const executeFn = async (
  fn: AsyncFunction,
  args: Parameters<AsyncFunction>
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
          "Differential encountered an unexpected error type. Make sure you are throwing an Error object."
        ),
        type: "rejection",
        functionExecutionTime,
      };
    }
  }
};

export class TaskQueue {
  private static tasks: Array<{
    fn: AsyncFunction;
    args: Parameters<AsyncFunction>;
    resolve: (value: Result) => void;
  }> = [];

  private static isRunning = false;

  static addTask(
    fn: AsyncFunction,
    args: Parameters<AsyncFunction>,
    resolve: (value: Result) => void
  ) {
    TaskQueue.tasks.push({
      fn,
      args,
      resolve,
    });

    TaskQueue.run();
  }

  private static run() {
    TaskQueue.isRunning = true;

    const tasks = TaskQueue.tasks;
    TaskQueue.tasks = [];

    Promise.all(
      tasks.map((task) => executeFn(task.fn, task.args).then(task.resolve))
    ).then(() => {
      TaskQueue.isRunning = false;
    });
  }

  static async quit() {
    return new Promise<void>((resolve) => {
      if (TaskQueue.tasks.length === 0) {
        resolve();
      } else {
        const interval = setInterval(() => {
          if (TaskQueue.tasks.length === 0) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      }
    });
  }
}
