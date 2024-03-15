import crypto from "crypto";
import msgpackr from "msgpackr";
import { DifferentialError } from "./errors";

const keyHashCache = new Map<Buffer, string>();

const getKeyHash = (key: Buffer) => {
  if (keyHashCache.has(key)) {
    return keyHashCache.get(key);
  }

  const keyHash = crypto.createHash("sha256").update(key).digest("base64");
  keyHashCache.set(key, keyHash);

  return keyHash;
};

const validation = (data: unknown) => {
  const packed1 = msgpackr.pack(data).toString("base64");
  const unpacked1 = msgpackr.unpack(Buffer.from(packed1, "base64"));
  const packed2 = msgpackr.pack(unpacked1).toString("base64");

  if (packed1 !== packed2) {
    throw new DifferentialError(DifferentialError.INVALID_DATA_TYPE);
  }
};

export const pack = (
  data: unknown,
  validate: boolean,
  params?: {
    cryptoSettings?: {
      keys: Buffer[];
    };
  },
): string => {
  if (validate) {
    validation(data);
  }

  if (!params?.cryptoSettings) {
    return msgpackr.pack(data).toString("base64");
  }

  const iv = crypto.randomBytes(16);
  const key = params.cryptoSettings.keys[0]; // alway use the first key. to roll keys, add the new key to the beginning of the array

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

  const encrypted =
    cipher.update(msgpackr.pack(data).toString("base64"), "base64", "base64") +
    cipher.final("base64");

  return msgpackr
    .pack({
      iv: iv.toString("base64"),
      encrypted,
      keyHash: crypto.createHash("sha256").update(key).digest("base64"),
    })
    .toString("base64");
};

export const unpack = (
  data: string,
  params?: {
    cryptoSettings?: {
      keys: Buffer[];
    };
  },
) => {
  const unpacked = msgpackr.unpack(Buffer.from(data, "base64"));

  if (unpacked?.iv && params?.cryptoSettings) {
    const iv = Buffer.from(unpacked.iv, "base64");
    const key = params.cryptoSettings.keys.find(
      (key) => getKeyHash(key) === unpacked.keyHash,
    );

    if (!key) {
      throw new DifferentialError(DifferentialError.UNKNOWN_ENCRYPTION_KEY);
    }

    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

    const decrypted =
      decipher.update(unpacked.encrypted, "base64", "base64") +
      decipher.final("base64");

    return msgpackr.unpack(Buffer.from(decrypted, "base64"));
  } else if (unpacked?.iv && !params?.cryptoSettings) {
    throw new DifferentialError(DifferentialError.UNKNOWN_ENCRYPTION_KEY);
  } else {
    return unpacked;
  }
};
