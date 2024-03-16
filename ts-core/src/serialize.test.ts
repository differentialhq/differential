import crypto from "crypto";
import { pack, unpack } from "./serialize";

describe("serailizing and deserializing", () => {
  const values = [
    1,
    "string",
    true,
    false,
    null,
    undefined,
    { hello: "Bob" },
    Buffer.from("hello"),
    [1, 2, 3],
    new Date(),
  ];

  values.forEach((value) => {
    it(`should serialise ${value}`, () => {
      expect(unpack(pack(value, true))).toEqual(value);
    });
  });
});

describe("encryption", () => {
  const cryptoSettings = {
    keys: [Buffer.from("abcdefghijklmnopqrstuvwxzy123456")],
  };

  it("should encrypt and decrypt", () => {
    const encrypted = pack({ hello: "Bob" }, true, { cryptoSettings });
    const decrypted = unpack(encrypted, { cryptoSettings });

    expect(decrypted).toEqual({ hello: "Bob" });
  });

  it("should be able to encrypt and decrypt when keys roll", () => {
    const encrypted = pack({ hello: "Bob" }, true, { cryptoSettings });

    const newCryptoSettings = {
      keys: [crypto.randomBytes(32), ...cryptoSettings.keys],
    };

    const decrypted = unpack(encrypted, { cryptoSettings: newCryptoSettings });

    expect(decrypted).toEqual({ hello: "Bob" });
  });
});
