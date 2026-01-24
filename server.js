import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { authRoutes } from './api/auth/auth.routes.js'
import { userRoutes } from './api/user/user.routes.js'
import { orderRoutes } from './api/order/order.routes.js'
import { logger } from './services/logger.service.js'

const app = express()
const PORT = process.env.PORT || 3030

// Middleware
app.use(cookieParser())
app.use(express.json())

const corsOptions = {
    origin: [
        'http://127.0.0.1:3000',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://localhost:5173',
        'http://127.0.0.1:5174',
        'http://localhost:5174'
    ],
    credentials: true
}
app.use(cors(corsOptions))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/order', orderRoutes)

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' })
})

const server = app.listen(PORT, () => {
    logger.info('Server is running on port: ' + PORT)
})

server.on('error', (err) => {
    logger.error('Server error:', err)
    process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
})
