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

const router = express.Router()

router.get('/', getItems)
router.get('/:id', getItemById)
router.post('/', addItem)
router.put('/', updateItem)
router.put('/:id/stock', updateItemStock)
router.post('/stock/import', importItemStock)
router.delete('/:id', deleteItem)

export const itemRoutes = router
