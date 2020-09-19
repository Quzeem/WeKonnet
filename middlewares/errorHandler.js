const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  // Make a copy of err object
  let error = { ...err };

  error.message = err.message;

  // Log error to the console
  console.log(err.stack.red);

  // Mongoose bad objectId
  if (err.name === 'CastError') {
    const message = `User with the ID: ${err.value} not found`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key value
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((value) => value.message); // array
    error = new ErrorResponse(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
  });
};

module.exports = errorHandler;
