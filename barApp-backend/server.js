import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import morgan from 'morgan'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
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
import mongoSanitize from 'mongo-sanitize'

const app = express()
const PORT = process.env.PORT || 3031

// ==================== MIDDLEWARE ====================

if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'))
} else {
    app.use(morgan('combined'))
}

app.use(cookieParser())

const devOrigins = [
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://localhost:5173',
    'http://127.0.0.1:5174',
    'http://localhost:5174',
    'http://127.0.0.1:5175',
    'http://localhost:5175',
]
const envOrigin = process.env.CORS_ORIGIN
const corsOrigins = envOrigin
    ? [...devOrigins, ...envOrigin.split(',').map(o => o.trim())]
    : devOrigins

const corsOptions = {
    origin: corsOrigins,
    credentials: true
}
app.use(cors(corsOptions))
app.use(express.json({ limit: '5mb' }))
app.use((req, _res, next) => {
    if (req.body) req.body = mongoSanitize(req.body)
    if (req.query) req.query = mongoSanitize(req.query)
    if (req.params) req.params = mongoSanitize(req.params)
    next()
})

// Rate limiting — strict on auth, general on all API
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
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
        await dbService.getMasterCollection('user')
        dbStatus = 'connected'
    } catch {
        dbStatus = 'error'
    }
    res.json({ status: 'OK', database: dbStatus })
})

// ==================== STATIC FILES (React build) ====================
app.use(express.static(join(__dirname, 'public')))
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'index.html'))
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

// ==================== GRACEFUL SHUTDOWN ====================
function shutdown(signal) {
    console.log(`\n${signal} received — shutting down gracefully...`)
    server.close(async () => {
        try {
            await dbService.close()
            console.log('MongoDB connection closed.')
        } catch { /* ignore */ }
        process.exit(0)
    })
    setTimeout(() => {
        console.error('Forced shutdown after timeout.')
        process.exit(1)
    }, 5000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
