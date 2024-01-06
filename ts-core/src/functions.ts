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

export const injectDifferentialConfig = (
  args: any[],
  config: DifferentialConfig
) => {
  const lastArg = args[args.length - 1];

  if (
    typeof lastArg === "object" &&
    lastArg !== null &&
    "__differentialConfig" in lastArg
  ) {
    const newLastArg = {
      __differentialConfig: {
        ...lastArg.__differentialConfig,
        ...config,
      },
    };

    return [...args.slice(0, args.length - 1), newLastArg];
  }

  return [
    ...args.slice(0, args.length - 1),
    {
      __differentialConfig: config,
    },
  ];
};

export const idempotent = <T extends AsyncFunction>(
  fn: T
): WithIdempotency<T> => {
  return (...args: Parameters<T>) => {
    return {
      withIdempotencyKey: (key: string) => {
        const newArgs = injectDifferentialConfig(args, {
          idempotencyKey: key,
        });

        return fn(...newArgs) as ReturnType<T>;
      },
    };
  };
};
