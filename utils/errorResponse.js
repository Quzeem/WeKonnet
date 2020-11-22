class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = true;

    // Prevent pollution of stack trace when the constructor method is called.
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ErrorResponse;
