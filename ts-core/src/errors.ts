export class DifferentialError extends Error {
  static UNAUTHORISED =
    "Invalid API Key or API Secret. Make sure you are using the correct API Secret.";

  static UNKNOWN_ENCRYPTION_KEY =
    "Encountered an encrypted message with an unknown encryption key. Make sure you are providing all encryption keys to the client.";

  static REMOTE_EXECUTION_ERROR =
    "An error occurred while executing the remote command. Either the machine stalled too many times or the function timed out.";

  static TOO_MANY_NETWORK_ERRORS =
    "Too many network errors occurred. Make sure the client is connected to the internet.";

  constructor(message: string, meta?: { [key: string]: unknown }) {
    super(message);
    this.name = "DifferentialError";
  }
}
