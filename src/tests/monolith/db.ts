import { d } from "./d";

(globalThis as any).db = true; // assert this is not registered by others

export const getNumberFromDB = async ({ input }: { input: number }) => {
  let result = 0;
  for (let i = 0; i < input; i++) {
    result += i;
  }
  return result;
};

export const dbService = d.service({
  name: "db",
  operations: {
    getNumberFromDB,
  },
});
