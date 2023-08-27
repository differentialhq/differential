import process from "process";
import { Differential } from "@differential-dev/sdk";

export const d = Differential({
  apiKey: "123",
  apiSecret: "456",
  environmentId: "dev-1",
  machineTypes: process.env.MACHINE_TYPE?.split(","),
});

let greetingCounts = 0;

// define any function
const greet = async (name: string) => {
  console.log(`Hello ${name} from pid ${process.pid}!`);
  await countGreets();
};

// count greetings
const countGreets = d.fn(
  async () => {
    greetingCounts++;
    console.log(`Greeted ${greetingCounts} times!`);
  },
  { machineType: "counter" }
);

if (process.env.MACHINE_TYPE === "greeter") {
  // run the function
  greet("World").then(() => {
    process.exit(0);
  });
} else {
  // keep the process alive so we can count greets
  process.stdin.resume();
}
