import { categoryService } from './category.service.js'

export async function getCategories(req, res, next) {
    try {
        const categories = await categoryService.query(req.userDbName)
        res.json(categories)
    } catch (error) {
        next(error)
    }
}

export async function getCategoryById(req, res, next) {
    try {
        const category = await categoryService.getById(req.params.id, req.userDbName)
        if (!category) return res.status(404).json({ error: 'Category not found' })
        res.json(category)
    } catch (error) {
        next(error)
    }
}

export async function addCategory(req, res, next) {
    try {
        const addedCategory = await categoryService.add(req.body, req.userDbName)
        res.status(201).json(addedCategory)
    } catch (error) {
        next(error)
    }
}

export async function updateCategory(req, res, next) {
    try {
        const category = req.body
        if (!category._id) return res.status(400).json({ error: 'Category ID is required' })
        const updatedCategory = await categoryService.update(category._id, category, req.userDbName)
        if (!updatedCategory) return res.status(404).json({ error: 'Category not found' })
        res.json(updatedCategory)
    } catch (error) {
        next(error)
    }
}

export async function deleteCategory(req, res, next) {
    try {
        const deletedCount = await categoryService.remove(req.params.id, req.userDbName)
        if (deletedCount === 1) res.json({ message: 'Deleted successfully' })
        else res.status(404).json({ error: 'Category not found' })
    } catch (error) {
        next(error)
    }
}
