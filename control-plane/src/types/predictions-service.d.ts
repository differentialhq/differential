export declare const predictionsService: import("@differentialhq/core/bin/Differential").RegisteredService<{
  name: "predictions";
  functions: {
    retryability: ({
      name,
      message,
    }: {
      name: string;
      message: string;
    }) => Promise<string>;
    patchFunction: ({
      name,
      message,
      fn,
    }: {
      name: string;
      message: string;
      fn: string;
    }) => Promise<string>;
  };
}>;
