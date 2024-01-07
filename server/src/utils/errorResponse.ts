class ErrorResponse extends Error {
  constructor(message: string, statusCode?: number, field?: string) {
    super(message);
    this.status = statusCode;
    if (field) {
      this.field = field;
    }
  }
}

export default ErrorResponse;
