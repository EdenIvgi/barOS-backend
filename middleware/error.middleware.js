/**
 * Centralized error handler — register LAST in server.js.
 * Controllers should call next(err) to route errors here.
 */
export function errorHandler(err, req, res, next) {
    const status = err.status || err.statusCode || 500
    const message = err.message || 'Internal server error'

    console.error(`[Error] ${req.method} ${req.originalUrl} → ${status}: ${message}`)
    if (status === 500) console.error(err.stack)

    res.status(status).json({
        error: message,
        ...(process.env.NODE_ENV !== 'production' && status === 500 && { stack: err.stack }),
    })
}

/**
 * Creates an error with a custom HTTP status code.
 */
export function createError(message, status = 500) {
    const err = new Error(message)
    err.status = status
    return err
}
