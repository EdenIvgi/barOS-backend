import express from 'express'
import { 
    getCategories, 
    getCategoryById, 
    addCategory, 
    updateCategory, 
    deleteCategory
} from './category.controller.js'

const router = express.Router()

router.get('/', getCategories)
router.get('/:id', getCategoryById)
router.post('/', addCategory)
router.put('/', updateCategory)
router.delete('/:id', deleteCategory)

export const categoryRoutes = router
