// Custom error class for API responses
// Extends the native Error class to include HTTP status codes and additional metadata
class Apierror extends Error {
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

export { Apierror }

/*
Usage examples:

throw new Apierror(400, "Invalid email format")
throw new Apierror(401, "Authentication required")
throw new Apierror(404, "User not found")
throw new Apierror(500, "Database connection failed", [], error.stack)
*/