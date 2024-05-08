import { initClient, tsRestFetchApi } from "@ts-rest/core";
import { contract } from "./contract";

export const createClient = ({
  baseUrl,
  machineId,
  deploymentId,
  clientAbortController,
}: {
  baseUrl: string;
  machineId: string;
  deploymentId?: string;
  clientAbortController?: AbortController;
}) =>
  initClient(contract, {
    baseUrl,
    baseHeaders: {
      "x-machine-id": machineId,
      ...(deploymentId && { "x-deployment-id": deploymentId }),
    },
    api: clientAbortController
      ? (args) => {
          return tsRestFetchApi({
            ...args,
            signal: clientAbortController.signal,
          });
        }
      : undefined,
  });
