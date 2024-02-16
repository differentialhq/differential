import { d } from "./d";

export const echo = async (echo: string) => {
  return {
    echo,
  };
};

export const loadService = d.service({
  name: "load",
  functions: {
    echo,
  },
});
