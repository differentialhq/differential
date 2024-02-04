import msgpackr from "msgpackr";
import { client } from "./client";
import { deserializeError } from "./serialize-error";

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
      return {
        retryable: false,
        reason: `predictor returned status ${retryable?.status}`,
      };
    }
  } else {
    return {
      retryable: false,
      reason: "no error name or message",
    };
  }
};
