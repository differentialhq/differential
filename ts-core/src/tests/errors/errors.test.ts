import { animalService } from "./animals";
import { d } from "./d";

describe("Errors", () => {
  beforeAll(async () => {
    await animalService.start();
  }, 10000);

  afterAll(async () => {
    await animalService.stop();
  });

  it("should get the normal error", async () => {
    const client = d.client<typeof animalService>("animal");

    expect(client.getNormalAnimal()).rejects.toThrow("This is a normal error");
  }, 10000);

  it("should get the custom error", async () => {
    const client = d.client<typeof animalService>("animal");

    try {
      await client.getCustomAnimal();
      expect(true).toBe(false);
    } catch (e: any) {
      expect(e.name).toBe("AnimalError");
      expect(e.name).not.toBe("Animal2Error");
    }
  }, 10000);
});
