import { assert } from "console";
import { d } from "../d";
import type { executorService } from "../services/executor";
import { t } from "../t";

const executorClient = d.client<typeof executorService>("executor");

t(async function parallel1000() {
  const input = Math.random().toString();

  const promises = new Array(1000).fill(null).map(() => {
    return executorClient.exec({
      wait: 0,
      error: false,
      input,
      outputType: "string",
      kill: false,
    });
  });

  const outputs = await Promise.all(promises);

  outputs.forEach((output) => {
    assert(output === input);
  });
});
