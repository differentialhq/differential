import { Differential } from "@differential-dev/sdk";

const params = {
  apiKey: "123",
  apiSecret: "456",
  environmentId: "dev-1",
};

export const d = Differential(params);
