// separating this and importing it allows
// tsx to run this before the rest of the app
// for dev purposes

require("dotenv").config();

import { z } from "zod";

export const truthy = z
  .enum(["0", "1", "true", "false"])
  .catch("false")
  .transform((value) => value == "true" || value == "1");

let envSchema = z
  .object({
    ENABLE_FASTIFY_LOGGER: truthy.default(false),
    DATABASE_URL: z.string().url(),
    DATABASE_SSL_DISABLED: truthy.default(false),
    PREDICTOR_API_URL: z.string().url().optional(),
    PREDICTOR_API_KEY: z.string().optional(),
    CONSOLE_ORIGIN: z
      .string()
      .url()
      .default("https://console.differential.dev"),
    JWKS_URL: z.string().url().optional(),
    MANAGEMENT_SECRET: z
      .string()
      .optional()
      .refine(
        (data) => {
          if (data) {
            const hasPrefix = data.startsWith("sk_management_");
            const hasLength = data.length > 64;
            return hasPrefix && hasLength;
          }
          return true;
        },
        {
          message:
            "MANAGEMENT_SECRET must start with sk_management_ and be longer than 64 characters",
          path: ["MANAGEMENT_SECRET"],
        },
      ),
    IGNORE_EXPIRATION: truthy.default(false),
    UPLOAD_BUCKET: z.string().optional(),
    CFN_BUCKET: z.string().optional(),
    DEPLOYMENT_SNS_TOPIC: z.string().optional(),
    SENTRY_DSN: z.string().optional(),
    DEPLOYMENT_SCHEDULING_ENABLED: truthy.default(false),
    ALLOW_EXIT_ON_IDLE: truthy.default(false),
  })
  .refine(
    (data) => {
      return data.JWKS_URL || data.MANAGEMENT_SECRET;
    },
    {
      message: "Either JWKS_URL or MANAGEMENT_SECRET must be set",
      path: ["JWKS_URL", "MANAGEMENT_SECRET"],
    },
  )
  .refine(
    (data) => {
      return !(data.JWKS_URL && data.MANAGEMENT_SECRET);
    },
    {
      message: "Only one of JWKS_URL or MANAGEMENT_SECRET can be set",
      path: ["JWKS_URL", "MANAGEMENT"],
    },
  )
  .transform((data) => {
    return {
      ...data,
      CLOUD_FEATURES_AVAILABLE:
        !!data.UPLOAD_BUCKET ||
        !!data.CFN_BUCKET ||
        !!data.DEPLOYMENT_SNS_TOPIC,
    };
  });

export const env = envSchema.parse(process.env);
