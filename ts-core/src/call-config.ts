/**
 * Configures the function call with extra options. All options need to be configured under the $d key.
 *
 * @example
 * ```ts
 * await client.getUsers({
 *   $d: {
 *     cache: {
 *       key: "users",
 *       ttlSeconds: 60,
 *    },
 * });
 * ```
 */
export type CallConfig = {
  cache?: {
    key: string;
    ttlSeconds: number;
  };
  retryCountOnStall?: number;
  predictiveRetriesOnRejection?: boolean;
  timeoutSeconds?: number;
  executionId?: string;
  // TODO: time travel
};

export type $d = {
  $d: CallConfig;
};

type AddParameters<
  TFunction extends (...args: any) => any,
  TParameters extends [...args: any],
  TResult,
> = (...args: [...Parameters<TFunction>, ...TParameters]) => TResult;

export type CallConfiguredFunction<TFunction extends (...args: any) => any> =
  AddParameters<TFunction, [$d?], ReturnType<TFunction>>;

export type CallConfiguredBackgroundFunction<
  TFunction extends (...args: any) => any,
> = AddParameters<TFunction, [$d?], Promise<{ id: string }>>;

export const extractCallConfig = (
  args: any[],
): {
  callConfig?: $d["$d"];
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
