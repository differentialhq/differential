// a naive cron implementation which will consume from a CDC later

const intervals: NodeJS.Timeout[] = [];

export const registerCron = async (
  fn: () => Promise<void>,
  { interval }: { interval: number }
) => {
  const intervalId = setInterval(fn, interval);
  intervals.push(intervalId);
};

process.on("beforeExit", () => {
  intervals.forEach((intervalId) => {
    clearInterval(intervalId);
  });
});
