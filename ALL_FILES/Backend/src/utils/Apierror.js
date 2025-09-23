// Custom error class for API responses
// Extends the native Error class to include HTTP status codes and additional metadata
class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ) {
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false  // Always false for errors
        this.errors = errors

        if (stack) {
            this.stack = stack
        } else {
            // Capture the stack trace, excluding this constructor call
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export { ApiError }

/*
Usage examples:

throw new ApiError(400, "Invalid email format")
throw new ApiError(401, "Authentication required")
throw new ApiError(404, "User not found")
throw new ApiError(500, "Database connection failed", [], error.stack)
*/