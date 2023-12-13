import { d } from "./d";

(globalThis as any).db = true; // assert this is not registered by others

export const getNumberFromDB = async (input1: number, input2: number) => {
  let result = 0;
  for (let i = 0; i < input1 * input2; i++) {
    result += i;
  }
  return result;
};

export const dbService = d.service({
  name: "db",
  functions: {
    getNumberFromDB,
  },
});
