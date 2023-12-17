import { Differential } from "@differentialhq/core";

// This is a temporary API sercret for testing purposes, created by npm init.
// You can obtain your own API sercret by signing up at https://differential.dev
const apiSecret = "REPLACE_ME";

export const d = new Differential(apiSecret);
