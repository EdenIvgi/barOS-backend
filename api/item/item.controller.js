import { itemService } from './item.service.js'

export async function getItems(req, res) {
    try {
        const result = await itemService.query(req.query)
        // Return in format expected by frontend: { items: [], maxPage: 0 }
        res.json(result)
    } catch (error) {
        console.error('[Controller] Error getting items:', error)
        res.status(500).json({ error: 'Failed to get items', details: error.message })
    }
}

export async function getItemById(req, res) {
    try {
        const { id: itemId } = req.params
        const item = await itemService.getById(itemId)
        if (!item) {
            return res.status(404).json({ error: 'Item not found' })
        }
        res.json(item)
    } catch (error) {
        console.error('[Controller] Error getting item by id:', error)
        res.status(500).json({ error: 'Failed to get item' })
    }
}

export async function addItem(req, res) {
    try {
        const item = req.body
        const addedItem = await itemService.add(item)
        res.status(201).json(addedItem)
    } catch (error) {
        console.error('[Controller] Error adding item:', error)
        res.status(500).json({ error: 'Failed to add item' })
    }
}

export async function updateItem(req, res) {
    try {
        const item = req.body
        const itemId = item._id
        if (!itemId) {
            return res.status(400).json({ error: 'Item ID is required' })
        }
        const updatedItem = await itemService.update(itemId, item)
        if (!updatedItem) {
            return res.status(404).json({ error: 'Item not found' })
        }
        res.json(updatedItem)
    } catch (error) {
        console.error('[Controller] Error updating item:', error)
        res.status(500).json({ error: 'Failed to update item' })
    }
}

export async function deleteItem(req, res) {
    try {
        const { id: itemId } = req.params
        const deletedCount = await itemService.remove(itemId)
        if (deletedCount === 1) {
            res.json({ message: 'Deleted successfully' })
        } else {
            res.status(404).json({ error: 'Item not found' })
        }
    } catch (error) {
        console.error('[Controller] Error deleting item:', error)
        res.status(500).json({ error: 'Failed to delete item' })
    }
}

export async function updateItemStock(req, res) {
    try {
        const { id: itemId } = req.params
        const { quantity } = req.body
        const updatedItem = await itemService.updateStock(itemId, quantity)
        if (!updatedItem) {
            return res.status(404).json({ error: 'Item not found' })
        }
        res.json(updatedItem)
    } catch (error) {
        console.error('[Controller] Error updating item stock:', error)
        res.status(500).json({ error: 'Failed to update item stock' })
    }
}
