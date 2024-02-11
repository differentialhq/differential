// a naive cron implementation which will consume from a CDC later

import * as lock from "./lock";

const intervals: NodeJS.Timeout[] = [];

export const registerCron = async (
  name: string,
  fn: () => Promise<unknown>,
  { interval }: { interval: number },
) => {
  const intervalId = setInterval(async () => {
    const mutex = lock.createMutex(name);

    const unlock = await mutex.tryLock();

    if (!unlock) {
      // already running by another process. skip
      return;
    }

    try {
      await fn();
    } catch (e) {
      console.error(e);
    } finally {
      await unlock();
    }
  }, interval);

  intervals.push(intervalId);
};

process.on("beforeExit", () => {
  intervals.forEach((intervalId) => {
    clearInterval(intervalId);
  });
});
