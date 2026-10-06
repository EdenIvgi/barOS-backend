import express from 'express'
import { getIngredients, addIngredient, deleteIngredient } from './ingredient.controller.js'
import { requireAuth, requireManager } from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'

const router = express.Router()

const ingredientSchema = {
    he: { isString: true, maxLength: 80 },
    en: { isString: true, maxLength: 80 },
}

router.get('/', requireAuth, getIngredients)

// A bar extends its own vocabulary; the shared entries are not writable here at
// all, and removing one is refused by the service rather than by this route.
router.post('/', requireAuth, requireManager, validate(ingredientSchema), addIngredient)
router.delete('/:slug', requireAuth, requireManager, deleteIngredient)

export const ingredientRoutes = router
