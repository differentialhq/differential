export const backgrounded = <T extends (...args: any[]) => Promise<any>>(
  fn: T
): ((...args: Parameters<T>) => void) => {
  return (...args) => {
    fn(...args).catch((err) => {
      console.error(`Error in backgrounded function`, fn.name, err);
    });
  };
};
