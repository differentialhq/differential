import { d } from "./d";

export const getNormalAnimal = async () => {
  throw new Error("This is a normal error");
};

export class AnimalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnimalError";
  }
}

export const getCustomAnimal = async () => {
  throw new AnimalError("This is a custom error");
};

export const animalService = d.service({
  name: "animal",
  functions: {
    getNormalAnimal,
    getCustomAnimal,
  },
});
