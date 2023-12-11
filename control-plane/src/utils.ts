type WithoutNullOrUndefined<T> = T extends null | undefined ? never : T;

export const invariant = <T>(
  value: T,
  message: string
): WithoutNullOrUndefined<T> => {
  if (value === null || value === undefined) {
    throw new Error(message);
  }

  return value as WithoutNullOrUndefined<T>;
};
