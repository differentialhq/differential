export class NotFoundError extends Error {
  statusCode: number = 404;

  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}
