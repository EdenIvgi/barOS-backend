/**
 * Centralized error handler — register LAST in server.js.
 * Controllers should call next(err) to route errors here.
 * 
 * SECURITY: Never include stack traces in API responses to avoid information disclosure
 */
export function errorHandler(err, req, res, next) {
    const status = err.status || err.statusCode || 500
    const message = err.message || 'Internal server error'

    // Always log stack trace server-side for debugging
    console.error(`[Error] ${req.method} ${req.originalUrl} → ${status}: ${message}`)
    if (status === 500) {
        console.error('Stack trace:', err.stack)
    }

    // SECURITY: Never expose stack traces or internal details in API responses
    const errorResponse = {
        error: message.length > 100 ? 'Internal server error' : message,
    }
    
    // Add error code for 4xx errors (helpful for client debugging)
    if (status >= 400 && status < 500) {
        errorResponse.code = err.code || `ERROR_${status}`
    } else if (status === 500) {
        // For 500 errors, return generic message to prevent information disclosure
        errorResponse.error = 'Internal server error'
    }

    res.status(status).json(errorResponse)
}

/**
 * Creates an error with a custom HTTP status code.
 */
export function createError(message, status = 500) {
    const err = new Error(message)
    err.status = status
    return err
}
