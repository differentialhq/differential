import { Differential } from "@differentialhq/core";

if (!process.env.LOAD_TESTER_API_SECRET) {
  throw new Error("LOAD_TESTER_API_SECRET not set");
}

export const d = new Differential(process.env.LOAD_TESTER_API_SECRET!);
