export class ExternalError extends Error {
  static errorName = "ExternalError";

  constructor(message: string) {
    super(message);
    this.name = ExternalError.errorName;
  }
}
