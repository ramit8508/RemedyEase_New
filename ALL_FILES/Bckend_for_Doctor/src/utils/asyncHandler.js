// Async handler wrapper for Express routes
// Eliminates repetitive try-catch blocks in controllers
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}

export { asyncHandler }

/* 
Different approaches I considered for async error handling:

// Approach 1: Basic Promise wrapper (current implementation)
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
}

// Approach 2: Traditional try-catch approach
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

// Approach 3: More explicit error handling
const asyncHandler = (fn) => (req, res, next) => {
    const fnReturn = fn(req, res, next)
    return Promise.resolve(fnReturn).catch(next)
}

Went with approach 1 because it's clean and works well with our
custom error handling middleware.
*/