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
    DATABASE_URL: z.string().url(),
    DATABASE_SSL_DISABLED: truthy.default(false),
    DATABASE_ALLOW_EXIT_ON_IDLE: truthy.default(false),
    LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
    NODE_ENV: z
      .enum(["test", "development", "production"])
      .default("development"),

    CONSOLE_ORIGIN: z
      .string()
      .url()
      .default("https://console.differential.dev"),

    ENABLE_FASTIFY_LOGGER: truthy.default(false),

    PREDICTOR_API_URL: z.string().url().optional(),
    PREDICTOR_API_KEY: z.string().optional(),

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
    JWT_IGNORE_EXPIRATION: truthy.default(false),

    SENTRY_DSN: z.string().optional(),

    ASSET_UPLOAD_BUCKET: z.string().optional(),
    DEPLOYMENT_TEMPLATE_BUCKET: z.string().optional(),
    DEPLOYMENT_SNS_TOPIC: z.string().optional(),
    DEPLOYMENT_SCHEDULING_ENABLED: truthy.default(false),
    DEPLOYMENT_DEFAULT_PROVIDER: z.enum(["lambda", "mock"]).default("mock"),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
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
        !!data.ASSET_UPLOAD_BUCKET ||
        !!data.DEPLOYMENT_TEMPLATE_BUCKET ||
        !!data.DEPLOYMENT_SNS_TOPIC ||
        !!data.AWS_ACCESS_KEY_ID ||
        !!data.AWS_SECRET_ACCESS_KEY,
    };
  });

let env: z.infer<typeof envSchema>;
try {
  env = envSchema.parse(process.env);
} catch (e: any) {
  // Use console.error rather than logger.error here because the logger
  // depends on the environment variables to be parsed
  console.error("Invalid environment variables provided", {
    errors: e.errors,
  });
  process.exit(1);
}

export { env };
