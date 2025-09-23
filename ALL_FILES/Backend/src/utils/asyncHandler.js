// Wrapper function to handle async operations in Express routes
// This eliminates the need for try-catch blocks in every controller
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}

export { asyncHandler }

/* 
Alternative implementations I considered:

// Version 1: Simple wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
}

// Version 2: Try-catch approach  
const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next)
    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message
        })
    }
}

I went with the Promise.resolve approach because it's cleaner
and works well with our centralized error handling middleware.
*/