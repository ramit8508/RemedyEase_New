// Standardized API response format
// Ensures consistent response structure across all endpoints
class ApiResponse {
    constructor(statusCode, data, message = "Success") {
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400  // Auto-determine success based on status code
    }
}

export { ApiResponse }

/*
Usage patterns:

// Success responses
return res.status(200).json(new ApiResponse(200, user, "User retrieved successfully"))
return res.status(201).json(new ApiResponse(201, newUser, "User created"))

// The success field automatically becomes:
// - true for status codes 200-399  
// - false for status codes 400+

This keeps our API responses consistent and predictable for frontend consumption.
*/