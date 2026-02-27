import express from 'express'
import {
    getItems,
    getItemById,
    addItem,
    updateItem,
    deleteItem,
    updateItemStock,
    importItemStock
} from './item.controller.js'
import { requireAuth, requireManager } from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'

const router = express.Router()

const itemSchema = {
    name: { required: true, minLength: 1 },
}

const stockSchema = {
    quantity: { required: true, isNumber: true },
}

router.get('/', requireAuth, getItems)
router.get('/:id', requireAuth, getItemById)
router.post('/', requireAuth, validate(itemSchema), addItem)
router.put('/', requireAuth, validate(itemSchema), updateItem)
router.put('/:id/stock', requireAuth, validate(stockSchema), updateItemStock)
router.post('/stock/import', requireAuth, requireManager, importItemStock)
router.delete('/:id', requireAuth, requireManager, deleteItem)

export const itemRoutes = router
