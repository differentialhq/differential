import process from "process";
import { Differential } from "@differential-dev/sdk";

export function initialize(kind: "greeter" | "counter") {
  const params = {
    apiKey: "123",
    apiSecret: "456",
    environmentId: "dev-1",
    machineTypes: [kind],
  };

  const d = Differential(params);
  d.init();

  let greetingCounts = 0;

  // define any function
  const greet = async (name: string) => {
    console.log(`Hello ${name} from pid ${process.pid}!`);
    await countGreets(process.pid);
  };

  // count greetings
  const countGreets = d.fn(
    async (pid: number) => {
      greetingCounts++;
      console.log(`Greeted ${greetingCounts} times from ${pid}!`);
    },
    { machineType: "counter" } // only run on counter machines
  );

  return { greet };
}
