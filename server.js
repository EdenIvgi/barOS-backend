import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { config } from './config/index.js'
import { dbService } from './services/mongo.service.js'
import { errorHandler } from './middleware/error.middleware.js'
import { itemRoutes } from './api/item/item.routes.js'
import { categoryRoutes } from './api/category/category.routes.js'
import { authRoutes } from './api/auth/auth.routes.js'
import { userRoutes } from './api/user/user.routes.js'
import { orderRoutes } from './api/order/order.routes.js'
import { recipeRoutes } from './api/recipe/recipe.routes.js'
import { barBookRoutes } from './api/barBook/barBook.routes.js'

const app = express()
const PORT = process.env.PORT || 3031

// Pre-connect to DB on startup
dbService.getCollection('items').catch(err => {
    console.error('Failed to connect to database on startup:', err)
})

// ==================== MIDDLEWARE ====================

app.use(cookieParser())

const corsOptions = {
    origin: [
        'http://127.0.0.1:3000',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://localhost:5173',
        'http://127.0.0.1:5174',
        'http://localhost:5174',
        'http://127.0.0.1:5175',
        'http://localhost:5175'
    ],
    credentials: true
}
app.use(cors(corsOptions))
app.use(express.json({ limit: '5mb' }))

// Rate limiting — strict on auth, general on all API
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
})

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
})

app.use('/api/auth', authLimiter)
app.use('/api', apiLimiter)

// ==================== ROUTES ====================

app.use('/api/auth', authRoutes)
app.use('/api/item', itemRoutes)
app.use('/api/category', categoryRoutes)
app.use('/api/user', userRoutes)
app.use('/api/order', orderRoutes)
app.use('/api/recipe', recipeRoutes)
app.use('/api/barBook', barBookRoutes)

// Health check
app.get('/health', async (req, res) => {
    let dbStatus = 'disconnected'
    try {
        await dbService.getCollection('items')
        dbStatus = 'connected'
    } catch {
        dbStatus = 'error'
    }
    res.json({ status: 'OK', database: dbStatus })
})

// ==================== ERROR HANDLER ====================
app.use(errorHandler)

// ==================== START SERVER ====================
const server = app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`)
    console.log(`API: http://localhost:${PORT}/api`)
})

server.on('error', (err) => {
    console.error('Server error:', err.message)
    process.exit(1)
})
