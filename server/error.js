// createError.js
export const createError = (status, message, details = null) => {
  const err = new Error(message);  // Create a new error with the provided message
  err.status = status;             // Set the status code (e.g., 404, 500)
  err.details = details;           // Optional: Additional details about the error
  err.timestamp = new Date().toISOString();  // Timestamp when the error occurred
  return err;  // Return the error object
};

// errorHandler.js
export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;  // Default to 500 if no status is provided
  const message = err.message || 'Something went wrong!';  // Default message
  const details = err.details || null;  // Optional details, can be null
  const timestamp = err.timestamp || new Date().toISOString();  // Timestamp for logging

  // Send structured error response to the client
  res.status(status).json({
    success: false,  // Indicating failure
    status,          // HTTP status code
    message,         // The error message
    details,         // Any additional details (can be null)
    timestamp,       // Timestamp of the error
  });

  // Log the error to the console (for debugging purposes)
  console.error(`[${timestamp}] Error: ${message} | Status: ${status} | Details: ${details}`);
};
