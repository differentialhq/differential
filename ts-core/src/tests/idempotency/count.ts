import { idempotent } from "../../functions";
import { d } from "./d";

let callCount = 0;

export const count = async (echo: string) => {
  return {
    callCount: ++callCount,
    echo,
  };
};

export const countService = d.service({
  name: "count",
  functions: {
    count: idempotent(count),
  },
});
