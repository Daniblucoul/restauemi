/**
 * Error handling middleware for the application
 * Provides consistent error responses and logging
 */

const fs = require('fs');
const path = require('path');

// Custom error class for application errors
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Log errors to file
const logError = (error, req) => {
  const logPath = path.join(__dirname, '../../server.log');
  const timestamp = new Date().toISOString();
  const logEntry = `
[${timestamp}] ERROR
Method: ${req.method}
URL: ${req.originalUrl}
Message: ${error.message}
Stack: ${error.stack}
Body: ${JSON.stringify(req.body)}
-------------------
`;

  try {
    fs.appendFileSync(logPath, logEntry);
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
};

// Database error handler
const handleDatabaseError = (error) => {
  if (error.message.includes('SQLITE_CONSTRAINT')) {
    if (error.message.includes('UNIQUE')) {
      return new AppError('This record already exists in the database', 409);
    }
    if (error.message.includes('FOREIGN KEY')) {
      return new AppError('Cannot perform this operation due to related records', 409);
    }
    if (error.message.includes('NOT NULL')) {
      return new AppError('Required field is missing', 400);
    }
    if (error.message.includes('CHECK')) {
      return new AppError('Data validation failed: value does not meet requirements', 400);
    }
  }
  
  if (error.message.includes('SQLITE_BUSY')) {
    return new AppError('Database is busy, please try again', 503);
  }

  return new AppError('Database operation failed', 500);
};

// Main error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Log the error
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method
  });

  // Log to file
  logError(err, req);

  // Handle database errors
  if (err.message && err.message.includes('SQLITE')) {
    error = handleDatabaseError(err);
  }

  // Convert to AppError if it's not already
  if (!(error instanceof AppError)) {
    error = new AppError(
      error.message || 'Something went wrong',
      error.statusCode || 500
    );
  }

  // Send error response
  const response = {
    status: 'error',
    message: error.message,
    ...(error.details && { details: error.details })
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(error.statusCode).json(response);
};

// Async error wrapper to avoid try-catch in every route
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler for undefined routes
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Cannot ${req.method} ${req.originalUrl} - Route not found`,
    404
  );
  next(error);
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
  logError
};
