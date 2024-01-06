import { AsyncFunction } from "./types";

type AddParameters<
  TFunction extends (...args: any) => any,
  TParameters extends [...args: any]
> = (
  ...args: [...Parameters<TFunction>, ...TParameters]
) => ReturnType<TFunction>;

type DifferentialConfig = {
  $idempotencyKey?: string;
};

export const extractDifferentialConfig = (
  args: any[]
): {
  differentialConfig: DifferentialConfig;
  originalArgs: any[];
} => {
  // just one now because we only support idempotency
  // this has the be a inverse for loop if we have more
  const lastArg = args[args.length - 1];

  if (
    typeof lastArg === "object" &&
    lastArg !== null &&
    "$idempotencyKey" in lastArg
  ) {
    return {
      differentialConfig: lastArg,
      originalArgs: args.slice(0, args.length - 1),
    };
  }

  return {
    differentialConfig: {},
    originalArgs: args,
  };
};

export const idempotent = <T extends AsyncFunction>(
  fn: T
): AddParameters<T, [Pick<DifferentialConfig, "$idempotencyKey">]> => {
  return fn as any;
};
