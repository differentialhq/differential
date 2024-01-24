import { Differential } from "@differentialhq/core";

if (!process.env.DIFFERENTIAl_API_KEY) {
  throw new Error("DIFFERENTIAl_API_KEY is not set");
}

export const d = new Differential(process.env.DIFFERENTIAl_API_KEY);
