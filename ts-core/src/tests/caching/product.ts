import { cached } from "../../functions";
import { d } from "./d";

export const getProduct = async (id: string) => {
  return {
    id,
    name: `Product ${id}`,
    retrievedAt: Date.now(),
  };
};

export const productService = d.service({
  name: "product",
  functions: {
    getProductLongCache: cached(getProduct, 10000),
    getProductShortCache: cached(getProduct, 100),
  },
});
