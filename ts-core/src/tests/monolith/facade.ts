import { d } from "./d";
import { expertService } from "./expert";

(globalThis as any).expert = true; // assert this is not registered by others

export const cowSay = async (text: string) => {
  return `
    ${text}
      \\   ^__^
       \\  (oo)\\_______
          (__)\\       )\\/\\
              ||----w |
              ||     ||
    `;
};

export const interFunctionCall = async (text: string) => {
  const result = await d.call<typeof expertService>("callExpert", text);

  return Promise.all([cowSay(text), result]);
};

export const facadeService = d.service({
  name: "facade",
  operations: {
    cowSay,
    interFunctionCall,
  },
});
