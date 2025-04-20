// middleware/errorHandler.js
const mongoose = require("mongoose");
const HttpStatus = require("http-status-codes");

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error("Central Error Handler:", err);

  // --- Mongoose Validation Error ---
  if (err.name === "ValidationError") {
    const validationErrors = {};
    for (const field in err.errors) {
      validationErrors[field] = err.errors[field].message;
    }
    return res.status(HttpStatus.StatusCodes.BAD_REQUEST).json({
      error: "Validation failed",
      details: validationErrors,
    });
  }

  // --- MongoDB Duplicate Key Error ---
  if (err.name === "MongoServerError" && err.code === 11000) {
    // Try to extract the field that caused the duplication
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = field
      ? `${field} '${value}' already exists.`
      : "Duplicate key error.";

    return res.status(HttpStatus.StatusCodes.BAD_REQUEST).json({
      // Or 409 Conflict
      error: "Resource conflict",
      details: message,
    });
  }

  // --- Mongoose Cast Error (e.g., invalid ObjectId format) ---
  if (err.name === "CastError") {
    return res.status(HttpStatus.StatusCodes.BAD_REQUEST).json({
      error: "Invalid data format",
      details: `Invalid value '${err.value}' for field '${err.path}'. Expected ${err.kind}.`,
    });
  }

  if (err.name === "MongoServerError" && err.code === 16755) {
    // Example code for invalid GeoJSON
    return res.status(HttpStatus.StatusCodes.BAD_REQUEST).json({
      error: "Invalid geospatial data provided.",
      details: err.message,
    });
  }

  // --- Default to 500 Internal Server Error ---
  const statusCode =
    err.statusCode || HttpStatus.StatusCodes.INTERNAL_SERVER_ERROR;
  const message =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "Internal server error"
      : err.message || "An unexpected error occurred";

  return res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}

module.exports = errorHandler;
