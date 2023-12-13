import { d } from "./d";

(globalThis as any).expert = true; // assert this is not registered by others

export const callExpert = async (text: string) => {
  return `Expert says: ${text}`;
};

export const expertService = d.service({
  name: "expert",
  functions: {
    callExpert,
  },
});
