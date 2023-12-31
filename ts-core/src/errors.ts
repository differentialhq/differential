export class DifferentialError extends Error {
  static UNAUTHORISED =
    "Invalid API Key or API Secret. Make sure you are using the correct API Secret.";

  static UNKNOWN_ENCRYPTION_KEY =
    "Encounterd an encrypted message with an unknown encryption key. Make sure you are providing all encryption keys to the client.";

  constructor(message: string, meta?: { [key: string]: unknown }) {
    super(message);
    this.name = "DifferentialError";
  }
}
