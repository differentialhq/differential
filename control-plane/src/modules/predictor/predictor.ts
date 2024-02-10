import msgpackr from "msgpackr";
import { client } from "./client";
import { deserializeError } from "./serialize-error";

export type PredictedRetryableResult = {
  retryable: boolean;
  reason?: string;
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

  if (error.name || error.message) {
    const retryable = await client?.predictRetryability({
      body: {
        errorName: error.name ?? "",
        errorMessage: error.message ?? "",
      },
      headers: {
        authorization: `Bearer ${process.env.PREDICTOR_API_KEY}`,
      },
    });

    if (retryable?.status === 200) {
      return {
        retryable: retryable.body.retryable,
      };
    } else {
      console.error(`Failed to predict retryability`, {
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
