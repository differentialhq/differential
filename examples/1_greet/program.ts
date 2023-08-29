import process from "process";
import { d } from "./differential";

let greetingCounts = 0;

// define any function
export const greet = async (name: string) => {
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
