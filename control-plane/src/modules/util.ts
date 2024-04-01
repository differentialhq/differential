import { logger } from "../utilities/logger";

export const backgrounded = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
): ((...args: Parameters<T>) => void) => {
  return (...args) => {
    fn(...args).catch((err) => {
      logger.error(`Error in backgrounded function`, {
        funcion: fn.name,
        error: err,
      });
    });
  };
};
