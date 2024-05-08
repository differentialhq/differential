import { d } from "./d";

const cache = new Map<string, any>();

export const getProduct = async (id: string, random: string) => {
  return {
    id,
    name: `Product ${id}`,
    random,
  };
};

export const succeedsOnSecondAttempt = async (id: string) => {
  if (cache.has(id)) {
    return true;
  } else {
    cache.set(id, true);
    // wait 5s and time out
    await new Promise((resolve) => setTimeout(resolve, 60000));
  }
};

export const productService = d.service({
  name: "product",
  functions: {
    getProduct,
    succeedsOnSecondAttempt,
  },
});
