// a naive cron implementation which will consume from a CDC later

const intervals: NodeJS.Timeout[] = [];

export const registerCron = async (
  fn: () => Promise<unknown>,
  { interval }: { interval: number },
) => {
  const intervalId = setInterval(fn, interval);
  intervals.push(intervalId);
};

process.on("beforeExit", () => {
  console.log("%%%%%%% beforeExit");
  intervals.forEach((intervalId) => {
    clearInterval(intervalId);
  });
});
