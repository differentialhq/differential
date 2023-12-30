import { Differential } from "@differentialhq/core";

export const d = new Differential(process.env.TESTER_API_SECRET!);
