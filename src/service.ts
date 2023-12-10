type ServiceDefinition = {
  [key: string]: <T>(...args: any[]) => Promise<T>;
};

export const service = <T extends ServiceDefinition>(
  name: string,
  definition: T
) => {
  return definition;
};
