import { AsyncFunction } from "./types";

type WithIdempotency<T extends AsyncFunction> = (...args: Parameters<T>) => {
  withIdempotencyKey: (key: string) => ReturnType<T>;
};

type DifferentialConfig = {
  idempotencyKey?: string;
};

export const extractDifferentialConfig = (args: any[]) => {
  const lastArg = args[args.length - 1];

  if (
    typeof lastArg === "object" &&
    lastArg !== null &&
    "__differentialConfig" in lastArg
  ) {
    return lastArg.__differentialConfig as DifferentialConfig;
  }

  return null;
};

export const idempotent = <T extends AsyncFunction>(
  fn: T
): WithIdempotency<T> => {
  return (...args: Parameters<T>) => {
    return {
      withIdempotencyKey: (key: string) => {
        // this is added to the args at the last index
        // because it won't affect how developers will choose
        // to do e2e testing via the service definition
        const newArgs = [
          ...args,
          {
            __differentialConfig: {
              idempotencyKey: key,
            },
          },
        ];

        return fn(...newArgs) as ReturnType<T>;
      },
    };
  };
};
