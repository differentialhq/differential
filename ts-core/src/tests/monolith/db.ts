export const getNumberFromDB = async (input1: number, input2: number) => {
  let result = 0;
  for (let i = 0; i < input1 * input2; i++) {
    result += i;
  }
  return result;
};

export const dbServiceDefinition = {
  name: "db",
  functions: {
    getNumberFromDB,
  },
}

