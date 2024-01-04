
export const callExpert = async (text: string) => {
  return `Expert says: ${text}`;
};

export const expertServiceDefinition = {
  name: "expert",
  functions: {
    callExpert,
  },
};
