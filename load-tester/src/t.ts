import fs from "fs";
import path from "path";

export const t = async (fn: () => Promise<void>) => {
  const start = Date.now();

  await fn();

  const end = Date.now();

  const duration = end - start;
  const name = fn.name;
  const date = new Date().toISOString();

  const data = { name, duration, date };

  console.log(`Test ${name} took ${duration}ms`);

  fs.appendFileSync("results.jsonl", JSON.stringify(data) + "\n");
};
