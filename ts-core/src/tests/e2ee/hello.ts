export const greet = async (names: string[]) => {
  return {
    result: `Hello ${names.join(", ")}`,
    names,
  };
};

export const helloServiceDefinition = {
  name: "hello",
  functions: {
    greet,
  },
};
