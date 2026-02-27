import { itemService } from './item.service.js'

export async function getItems(req, res, next) {
    try {
        const result = await itemService.query(req.query)
        res.json(result)
    } catch (error) {
        next(error)
    }
}

export async function getItemById(req, res, next) {
    try {
        const item = await itemService.getById(req.params.id)
        if (!item) return res.status(404).json({ error: 'Item not found' })
        res.json(item)
    } catch (error) {
        next(error)
    }
}

export async function addItem(req, res, next) {
    try {
        const addedItem = await itemService.add(req.body)
        res.status(201).json(addedItem)
    } catch (error) {
        next(error)
    }
}

export async function updateItem(req, res, next) {
    try {
        const item = req.body
        if (!item._id) return res.status(400).json({ error: 'Item ID is required' })
        const updatedItem = await itemService.update(item._id, item)
        if (!updatedItem) return res.status(404).json({ error: 'Item not found' })
        res.json(updatedItem)
    } catch (error) {
        next(error)
    }
}

export async function deleteItem(req, res, next) {
    try {
        const deletedCount = await itemService.remove(req.params.id)
        if (deletedCount === 1) res.json({ message: 'Deleted successfully' })
        else res.status(404).json({ error: 'Item not found' })
    } catch (error) {
        next(error)
    }
}

export async function updateItemStock(req, res, next) {
    try {
        const updatedItem = await itemService.updateStock(req.params.id, req.body.quantity)
        if (!updatedItem) return res.status(404).json({ error: 'Item not found' })
        res.json(updatedItem)
    } catch (error) {
        next(error)
    }
}

export async function importItemStock(req, res, next) {
    try {
        const { rows, dryRun = true, mode = 'set' } = req.body || {}
        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json({ error: 'rows array is required' })
        }
        const result = await itemService.importStock(rows, { dryRun: !!dryRun, mode })
        res.json(result)
    } catch (error) {
        next(error)
    }
}
