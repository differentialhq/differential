import { assert } from "console";
import { d } from "../d";
import type { executorService } from "../services/executor";
import { t } from "../t";

const executorClient = d.client<typeof executorService>("executor");

t(async function basic() {
  const input = Math.random().toString();

  const expectations = {
    object: { type: "object", value: input },
    string: input,
    array: [input],
    number: 1,
    boolean: true,
    null: null,
    undefined: undefined,
  };

  const result = await Promise.all(
    Object.keys(expectations).map((outputType) =>
      executorClient.exec({
        wait: 0,
        error: false,
        input,
        outputType: outputType as any,
        kill: false,
      })
    )
  );

  assert(
    JSON.stringify(result) === JSON.stringify(Object.values(expectations))
  );
});
