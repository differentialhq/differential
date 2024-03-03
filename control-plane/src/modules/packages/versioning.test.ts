import { ulid } from "ulid";
import * as data from "../data";
import { createOwner } from "../test/util";
import {
  previousVersion,
  incrementVersion,
  SemVerIncrement,
} from "./versioning";

describe("versioning", () => {
  let cluster1: string;

  beforeAll(async () => {
    cluster1 = (await createOwner()).clusterId;

    const versions = ["1.0.0", "1.0.1", "1.1.0", "2.9.9", "3.0.0"];

    const upload = await data.db
      .insert(data.assetUploads)
      .values({
        id: ulid(),
        type: "client_library",
        bucket: "bucket",
        key: "key",
      })
      .returning({
        id: data.assetUploads.id,
      });

    for (const version of versions) {
      await data.db.insert(data.clientLibraryVersions).values({
        id: ulid(),
        cluster_id: cluster1,
        asset_upload_id: upload[0].id,
        version,
      });
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return the highest version library", async () => {
    const result = await previousVersion({ clusterId: cluster1 });
    expect(result).toBe("3.0.0");
  });

  it("should return 0.0.0 if no version exist", async () => {
    const result = await previousVersion({ clusterId: "nonexistent" });
    expect(result).toBe("0.0.0");
  });

  it.each([
    ["patch", "3.0.1"],
    ["minor", "3.1.0"],
    ["major", "4.0.0"],
  ])(`should increment version by %s`, async (increment, expected) => {
    const result = incrementVersion({
      version: "3.0.0",
      increment: increment as SemVerIncrement,
    });
    expect(result).toBe(expected);
  });
});
