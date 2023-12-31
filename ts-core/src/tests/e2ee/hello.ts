import { d } from "./d";

export const greet = async (names: string[]) => {
  return {
    result: `Hello ${names.join(", ")}`,
    names,
  };
};

export const helloService = d.service({
  name: "hello",
  functions: {
    greet,
  },
});
