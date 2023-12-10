import { ServiceDefinition } from "../../Differential";
import * as db from "./db";
import * as expert from "./expert";

export const cpuService: ServiceDefinition = {
  name: "cpuService",
  operations: {
    cpuIntensiveOperation: {
      fn: db.cpuIntensiveOperation,
    },
  },
};
