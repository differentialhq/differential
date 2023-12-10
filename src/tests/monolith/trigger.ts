import { d } from "./d";
import type { dbService } from "./db";

(async function f() {
  const result = await d.call<typeof dbService>("cpuIntensiveOperation", {
    input: 10,
  });

  const dbInitialised = (globalThis as any).db;

  if (dbInitialised) {
    throw new Error("db should not be initialised");
  }

  console.log(`result: ${result}`);
})();
