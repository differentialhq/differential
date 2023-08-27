import process from "process";
import { Differential } from "@differential-dev/sdk";

const params = {
  apiKey: "123",
  apiSecret: "456",
  environmentId: "dev-1",
  machineTypes: process.env.MACHINE_TYPE?.split(","),
};

export const d = Differential(params);
d.init();

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
  greet("World")
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
} else if (process.env.MACHINE_TYPE === "counter") {
  // keep the process alive so we can count greets
  process.stdin.resume();
} else {
  console.log("Please specify a MACHINE_TYPE");
  process.exit(1);
}
