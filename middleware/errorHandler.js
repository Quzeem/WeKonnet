const ErrorResponse = require('../utils/errorResponse');
const logger = require('../utils/winstonLogger');

const errorHandler = (err, req, res, next) => {
  // Make a copy of err object
  let error = { ...err };

  error.message = err.message;

  // Log error
  logger.error(err.message);

  // Mongoose bad objectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key value
  if (err.code === 11000) {
    const keyVal = Object.keys(err.keyValue)[0];
    const message = `${keyVal} already exists. Please, use a different ${keyVal}`;
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messageArr = Object.values(err.errors).map((value) => value.message);
    const message = `Invalid input data: ${messageArr.join(', ')}`;
    error = new ErrorResponse(message, 400);
  }

  // File upload error
  if (err.message === 'File too large') {
    const message = 'Please upload a file less than 1MB';
    error = new ErrorResponse(message, 400);
  }

  if (process.env.NODE_ENV === 'development') {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Server Error',
      stack: err.stack,
    });
  } else if (process.env.NODE_ENV === 'production') {
    // Operational or known errors: send custom message to the client
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
      // Programming or unknown errors: don't leak error details to the client
    } else {
      // Log error
      logger.error(err.stack);

      // Send generic message
      res.status(500).json({
        success: false,
        error: 'Something went wrong!',
      });
    }
  }
};

module.exports = errorHandler;
