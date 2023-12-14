import { TaskQueue } from "./task-queue";

jest.useFakeTimers();

describe("TaskQueue", () => {
  const task = () => {
    return {
      fn: jest.fn(),
      args: ["arg1", "arg2"],
      resolve: jest.fn(),
    };
  };

  it("should be able to queue and run tasks", async () => {
    const t = task();
    expect(t.fn).not.toHaveBeenCalled();
    expect(t.resolve).not.toHaveBeenCalled();

    TaskQueue.addTask(t.fn, t.args, t.resolve);

    jest.runAllTimers();

    // Wait for the task to be resolved
    while (t.resolve.mock.calls.length === 0) {
      await Promise.resolve();
    }

    expect(t.fn).toHaveBeenCalledWith(...t.args);
    expect(t.resolve).toHaveBeenCalled();
  });

  it("should be able to queue and run multiple tasks", async () => {
    const t1 = task();
    const t2 = task();
    const t3 = task();

    TaskQueue.addTask(t1.fn, t1.args, t1.resolve);
    TaskQueue.addTask(t2.fn, t2.args, t2.resolve);
    TaskQueue.addTask(t3.fn, t3.args, t3.resolve);

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
  });

  it("should not run the same task twice", async () => {
    async function firstRun() {
      const t = task();

      TaskQueue.addTask(t.fn, t.args, t.resolve);

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

      TaskQueue.addTask(t.fn, t.args, t.resolve);

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
  });
});
