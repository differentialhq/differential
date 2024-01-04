import { d } from "./d";
import { dbServiceDefinition } from "./db";

describe("imports", () => {
  it("should not import a service, if we're just consuming it", async () => {
    const db = d.client(dbServiceDefinition, { background: true });

    const result = await db.getNumberFromDB(1, 2);

    expect(result.id).toBeDefined();

    // at this point, dbService should not be registered
    expect((globalThis as any).db).toBeUndefined();
  });
});
