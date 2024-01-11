import { TaskQueue } from "./task-queue";

describe("TaskQueue", () => {
  const task = () => {
    return {
      fn: jest.fn(),
      args: ["arg1", "arg2"],
      resolve: jest.fn(),
    };
  };

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("should be able to queue and run tasks", async () => {
    const t = task();
    expect(t.fn).not.toHaveBeenCalled();
    expect(t.resolve).not.toHaveBeenCalled();

    const taskQueue = new TaskQueue();
    taskQueue.addTask(t.fn, t.args, t.resolve);

    jest.runAllTimers();

    // Wait for the task to be resolved
    while (t.resolve.mock.calls.length === 0) {
      await Promise.resolve();
    }

    expect(t.fn).toHaveBeenCalledWith(...t.args);
    expect(t.resolve).toHaveBeenCalled();

    await taskQueue.quit();
  });

  it("should be able to queue and run multiple tasks", async () => {
    const t1 = task();
    const t2 = task();
    const t3 = task();

    const taskQueue = new TaskQueue();
    taskQueue.addTask(t1.fn, t1.args, t1.resolve);
    taskQueue.addTask(t2.fn, t2.args, t2.resolve);
    taskQueue.addTask(t3.fn, t3.args, t3.resolve);

    jest.runAllTimers();

    // Wait for the task to be resolved
    while (t1.resolve.mock.calls.length === 0) {
      await Promise.resolve();
    }

    expect(t1.fn).toHaveBeenCalledWith(...t1.args);
    expect(t1.resolve).toHaveBeenCalled();

    expect(t2.fn).toHaveBeenCalledWith(...t2.args);
    expect(t2.resolve).toHaveBeenCalled();

    expect(t3.fn).toHaveBeenCalledWith(...t3.args);
    expect(t3.resolve).toHaveBeenCalled();

    await taskQueue.quit();
  });

  it("should not run the same task twice", async () => {
    const taskQueue = new TaskQueue();

    async function firstRun() {
      const t = task();

      taskQueue.addTask(t.fn, t.args, t.resolve);

      jest.runAllTimers();

      // Wait for the task to be resolved
      while (t.resolve.mock.calls.length === 0) {
        await Promise.resolve();
      }

      expect(t.fn).toHaveBeenCalledTimes(1);
      expect(t.resolve).toHaveBeenCalledTimes(1);

      return {
        t,
      };
    }

    async function secondRun() {
      const t = task();

      taskQueue.addTask(t.fn, t.args, t.resolve);

      jest.runAllTimers();

      // Wait for the task to be resolved
      while (t.resolve.mock.calls.length === 0) {
        await Promise.resolve();
      }

      expect(t.fn).toHaveBeenCalledTimes(1);
      expect(t.resolve).toHaveBeenCalledTimes(1);
    }

    const { t } = await firstRun();
    await secondRun();

    expect(t.fn).toHaveBeenCalledTimes(1);

    await taskQueue.quit();
  });

  it("should record execution time", async () => {
    const t = task();
    const fn = () =>
      new Promise((resolve) => {
        setTimeout(resolve, 102);
      });
    const taskQueue = new TaskQueue();
    taskQueue.addTask(fn, t.args, t.resolve);

    jest.runAllTimers();

    // Wait for the task to be resolved
    while (t.resolve.mock.calls.length === 0) {
      await Promise.resolve();
    }

    expect(t.resolve).toHaveBeenCalledWith({
      type: "resolution",
      functionExecutionTime: 102,
    });

    await taskQueue.quit();
  });
});
