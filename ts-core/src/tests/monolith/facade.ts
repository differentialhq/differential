import { d } from "./d";
import { expertService } from "./expert";

(globalThis as any).expert = true; // assert this is not registered by others

export const cowSay = async ({ cowText }: { cowText: string }) => {
  return `
    ${cowText}
      \\   ^__^
       \\  (oo)\\_______
          (__)\\       )\\/\\
              ||----w |
              ||     ||
    `;
};

const expertClient = d.client<typeof expertService>("expert");

export const interFunctionCall = async ({
  expertText,
  cowText,
}: {
  expertText: string;
  cowText: string;
}) => {
  const result = await expertClient.callExpert(expertText);

  return Promise.all([cowSay({ cowText }), result]);
};

export const facadeService = d.service({
  name: "facade",
  functions: {
    cowSay,
    interFunctionCall,
  },
});
