require("dotenv").config();

import { Differential } from "../../Differential";

if (!process.env.DIFFERENTIAL_API_SECRET) {
  throw new Error("Missing env DIFFERENTIAL_API_SECRET");
}

export const d = new Differential(process.env.DIFFERENTIAL_API_SECRET, {
  encryptionKeys: [Buffer.from("abcdefghijklmnopqrstuvwxzy123456")],
});
