import { assert } from "console";
import { executorClient } from "./parallel-100";

export async function parallel(n: number) {
  const inputs = new Array(n).fill(null).map(() => Math.random().toString());

  const promises = inputs.map((input) => {
    return executorClient.exec({
      wait: 0,
      error: false,
      input,
      outputType: "string",
      kill: false,
    });
  });

  const outputs = await Promise.all(promises);

  outputs.forEach((output, i) => {
    assert(output === inputs[i]);
  });
}
