import express from 'express'
import {
    getCategories,
    getCategoryById,
    addCategory,
    updateCategory,
    deleteCategory
} from './category.controller.js'
import { requireAuth } from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validate.middleware.js'

const router = express.Router()

const categorySchema = {
    name: { required: true, minLength: 1 },
}

router.get('/', requireAuth, getCategories)
router.get('/:id', requireAuth, getCategoryById)
router.post('/', requireAuth, validate(categorySchema), addCategory)
router.put('/', requireAuth, validate(categorySchema), updateCategory)
router.delete('/:id', requireAuth, deleteCategory)

export const categoryRoutes = router
