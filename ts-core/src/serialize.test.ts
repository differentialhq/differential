import { pack, unpack } from "./serialize";
import crypto from "crypto";

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
  ];

  values.forEach((value) => {
    it(`should serialise ${value}`, () => {
      expect(unpack(pack(value))).toEqual(value);
    });
  });
});

describe("encryption", () => {
  const cryptoSettings = {
    keys: [Buffer.from("abcdefghijklmnopqrstuvwxzy123456")],
  };

  it("should encrypt and decrypt", () => {
    const encrypted = pack({ hello: "Bob" }, { cryptoSettings });
    const decrypted = unpack(encrypted, { cryptoSettings });

    expect(decrypted).toEqual({ hello: "Bob" });
  });

  it("should be able to encrypt and decrypt when keys roll", () => {
    const encrypted = pack({ hello: "Bob" }, { cryptoSettings });

    const newCryptoSettings = {
      keys: [crypto.randomBytes(32), ...cryptoSettings.keys],
    };

    const decrypted = unpack(encrypted, { cryptoSettings: newCryptoSettings });

    expect(decrypted).toEqual({ hello: "Bob" });
  });
});
