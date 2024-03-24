import { and, eq } from "drizzle-orm";
import msgpackr from "msgpackr";
import * as data from "../data";
import { client } from "./client";
import { deserializeError } from "./serialize-error";
import { env } from "../../utilities/env";
import { logger } from "../../utilities/logger";

export type PredictedRetryableResult = {
  retryable: boolean;
  reason?: string;
  cached?: boolean;
};

export const isRetryable = async (resultContent: string) => {
  const unpacked = msgpackr.unpack(Buffer.from(resultContent, "base64"));

  if (unpacked?.iv) {
    return {
      retryable: false,
      reason: "This result is encrypted",
    };
  }

  const error = deserializeError(unpacked);

  const [cached] = await data.db
    .select({
      retryable: data.predictiveRetriesCache.retryable,
    })
    .from(data.predictiveRetriesCache)
    .where(
      and(
        eq(data.predictiveRetriesCache.error_name, error.name),
        eq(data.predictiveRetriesCache.error_message, error.message),
      ),
    )
    .limit(1);

  if (cached) {
    return {
      retryable: cached.retryable,
      cached: true,
    };
  }

  if (error.name || error.message) {
    const retryable = await client?.predictRetryability({
      body: {
        errorName: error.name ?? "",
        errorMessage: error.message ?? "",
      },
      headers: {
        authorization: `Bearer ${env.PREDICTOR_API_KEY}`,
      },
    });

    if (retryable?.status === 200) {
      await data.db
        .insert(data.predictiveRetriesCache)
        .values([
          {
            error_name: error.name,
            error_message: error.message,
            retryable: retryable.body.retryable,
          },
        ])
        .catch((e) => {
          logger.error(`Failed to cache prediction`, {
            error: e,
            errorName: error.name,
            errorMessage: error.message,
          });
        });

      return {
        retryable: retryable.body.retryable,
      };
    } else {
      logger.error(`Failed to predict retryability`, {
        status: retryable?.status,
        body: retryable?.body,
      });

      return {
        retryable: false,
        reason: `Something went wrong while predicting retryability. Status=${retryable?.status}`,
      };
    }
  } else {
    return {
      retryable: false,
      reason: "no error name or message",
    };
  }
};
