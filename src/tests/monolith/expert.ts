import { d } from "./d";

(globalThis as any).expert = true; // assert this is not registered by others

export const callExpert = async (input: number) => {
  return `I am an expert, I know the answer is ${input}`;
};

const expertService = d.service({
  name: "expert",
  operations: {
    callExpert: {
      fn: callExpert,
    },
  },
});

expertService.start();
