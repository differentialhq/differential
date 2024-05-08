import { z } from "zod";

export type AsyncFunction<Args extends {} = any, Output extends {} = any> = {
  input: z.ZodObject<any>;
  func: (args: Args) => Promise<Output>;
};
