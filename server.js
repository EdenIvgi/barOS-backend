import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { MongoClient } from 'mongodb'
import { config } from './config/index.js'
import { itemRoutes } from './api/item/item.routes.js'
import { categoryRoutes } from './api/category/category.routes.js'
import { authRoutes } from './api/auth/auth.routes.js'
import { userRoutes } from './api/user/user.routes.js'
import { orderRoutes } from './api/order/order.routes.js'

const app = express()
const PORT = process.env.PORT || 3031

// MongoDB connection
let db = null

async function connectToDB() {
    try {
        if (db) return db
        const client = await MongoClient.connect(config.dbURL)
        db = client.db(config.dbName)
        return db
    } catch (err) {
        console.error('MongoDB connection failed:', err.message)
        throw err
    }
}

// Test connection on startup
connectToDB().catch(err => {
    console.error('Failed to connect to database:', err)
})

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

// ==================== API ROUTES ====================
app.use('/api/item', itemRoutes)
app.use('/api/category', categoryRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/order', orderRoutes)

// ==================== OLD ENDPOINTS (REMOVED - NOW USING ROUTES ABOVE) ====================
app.get('/api/order', async (req, res) => {
    try {
        if (!db) await connectToDB()
        const criteria = {}
        if (req.query.userId) criteria.userId = req.query.userId
        if (req.query.status) criteria.status = req.query.status
        
        const orders = await db.collection('order').find(criteria).sort({ createdAt: -1 }).toArray()
        res.json(orders)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

app.get('/api/order/active', async (req, res) => {
    try {
        if (!db) await connectToDB()
        const orders = await db.collection('order').find({
            status: { $in: ['pending', 'processing', 'preparing'] }
        }).sort({ createdAt: -1 }).toArray()
        res.json(orders)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

app.get('/api/order/:id', async (req, res) => {
    try {
        if (!db) await connectToDB()
        let order
        try {
            order = await db.collection('order').findOne({ _id: ObjectId.createFromHexString(req.params.id) })
        } catch {
            order = await db.collection('order').findOne({ _id: req.params.id })
        }
        if (!order) {
            return res.status(404).json({ error: 'Order not found' })
        }
        res.json(order)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

app.post('/api/order', async (req, res) => {
    try {
        if (!db) await connectToDB()
        const orderData = req.body
        const totalAmount = orderData.items.reduce((sum, item) => sum + (item.subtotal || 0), 0)
        
        const order = {
            items: orderData.items,
            userId: orderData.userId,
            status: orderData.status || 'pending',
            totalAmount,
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
        
        const result = await db.collection('order').insertOne(order)
        order._id = result.insertedId
        res.status(201).json(order)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

app.put('/api/order/:id', async (req, res) => {
    try {
        if (!db) await connectToDB()
        const orderData = req.body
        const updateData = { ...orderData }
        delete updateData._id
        
        if (updateData.items) {
            updateData.totalAmount = updateData.items.reduce((sum, item) => sum + (item.subtotal || 0), 0)
        }
        updateData.updatedAt = Date.now()
        
        let result
        try {
            result = await db.collection('order').updateOne(
                { _id: ObjectId.createFromHexString(req.params.id) },
                { $set: updateData }
            )
        } catch {
            result = await db.collection('order').updateOne(
                { _id: req.params.id },
                { $set: updateData }
            )
        }
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Order not found' })
        }
        
        const updatedOrder = await db.collection('order').findOne({ _id: req.params.id })
        res.json(updatedOrder)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

app.put('/api/order/:id/status', async (req, res) => {
    try {
        if (!db) await connectToDB()
        const { status } = req.body
        
        let result
        try {
            result = await db.collection('order').updateOne(
                { _id: ObjectId.createFromHexString(req.params.id) },
                { $set: { status, updatedAt: Date.now() } }
            )
        } catch {
            result = await db.collection('order').updateOne(
                { _id: req.params.id },
                { $set: { status, updatedAt: Date.now() } }
            )
        }
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Order not found' })
        }
        
        const updatedOrder = await db.collection('order').findOne({ _id: req.params.id })
        res.json(updatedOrder)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

app.delete('/api/order/:id', async (req, res) => {
    try {
        if (!db) await connectToDB()
        let result
        try {
            result = await db.collection('order').deleteOne({ _id: ObjectId.createFromHexString(req.params.id) })
        } catch {
            result = await db.collection('order').deleteOne({ _id: req.params.id })
        }
        
        if (result.deletedCount === 1) {
            res.json({ message: 'Deleted successfully' })
        } else {
            res.status(404).json({ error: 'Order not found' })
        }
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        database: db ? 'Connected' : 'Not connected'
    })
})

const server = app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`)
    console.log(`API Base URL: http://localhost:${PORT}/api`)
})

server.on('error', (err) => {
    console.error('Server error:', err.message)
    process.exit(1)
})
