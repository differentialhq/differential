type CallConfig = {
  $d: {
    cache?: {
      key: string;
      ttlSeconds: number;
    };
    retry?: {
      attempts: number;
      predictive: boolean;
    };
    timeoutSeconds?: number;
    executionId?: string;
    background?: boolean;
    // TODO: time travel
  };
};

type AddParameters<
  TFunction extends (...args: any) => any,
  TParameters extends [...args: any],
  TResult,
> = (...args: [...Parameters<TFunction>, ...TParameters]) => TResult;

export type CallConfiguredFunction<TFunction extends (...args: any) => any> =
  AddParameters<TFunction, [CallConfig?], ReturnType<TFunction>>;

export type CallConfiguredBackgroundFunction<
  TFunction extends (...args: any) => any,
> = AddParameters<TFunction, [CallConfig?], Promise<{ id: string }>>;

export const extractCallConfig = (
  args: any[],
): {
  callConfig?: CallConfig["$d"];
  originalArgs: any[];
} => {
  const lastArg = args[args.length - 1];

  if (typeof lastArg === "object" && lastArg !== null && "$d" in lastArg) {
    return {
      callConfig: lastArg.$d,
      originalArgs: args.slice(0, args.length - 1),
    };
  }

  return {
    originalArgs: args,
  };
};
