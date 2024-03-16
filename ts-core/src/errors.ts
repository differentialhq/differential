export class DifferentialError extends Error {
  static UNAUTHORISED =
    "Invalid API Key or API Secret. Make sure you are using the correct API Secret.";

  static UNKNOWN_ENCRYPTION_KEY =
    "Encountered an encrypted message with an unknown encryption key. Make sure you are providing all encryption keys to the client.";

  static EXECUTION_DID_NOT_COMPLETE =
    "An error occurred while executing the function remotely. Machine may have stalled too many times or the function timed out before reporting a completion status.";

  static TOO_MANY_NETWORK_ERRORS =
    "Too many network errors occurred. Make sure the client is connected to the internet.";

  static INVALID_DATA_TYPE =
    "Serialization process encountered an invalid data type. The data can not be safely serialized. See: https://docs.differential.dev/advanced/arguments-and-return-values/";

  constructor(message: string, meta?: { [key: string]: unknown }) {
    super(message);
    this.name = "DifferentialError";
  }
}
