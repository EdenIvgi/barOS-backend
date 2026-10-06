import { barCatalog } from '../../services/barCatalog.service.js'
import { createError } from '../../middleware/error.middleware.js'

export async function getIngredients(req, res, next) {
    try {
        const catalog = await barCatalog.get(req.userDbName)
        res.json({ ingredients: catalog.all() })
    } catch (error) {
        next(error)
    }
}

export async function addIngredient(req, res, next) {
    try {
        const created = await barCatalog.addIngredient(req.body, req.userDbName)
        res.status(201).json(created)
    } catch (error) {
        next(error)
    }
}

export async function deleteIngredient(req, res, next) {
    try {
        const removed = await barCatalog.removeIngredient(req.params.slug, req.userDbName)
        if (!removed) return next(createError('Ingredient not found', 404))
        res.json({ ok: true })
    } catch (error) {
        next(error)
    }
}
