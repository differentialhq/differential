import { Differential } from "../../Differential";

process.env.DIFFERENTIAL_API_ENDPOINT_OVERRIDE = "http://0.0.0.0:4000";

export const d = new Differential(
  "sk_6299d50747b15b7fc223897bd1c5d84ef83ff369c926bd68d1ccd64285ba84f8"
);
