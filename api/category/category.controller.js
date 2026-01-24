import { categoryService } from './category.service.js'

export async function getCategories(req, res) {
    try {
        const categories = await categoryService.query()
        res.json(categories)
    } catch (error) {
        console.error('[Controller] Error getting categories:', error)
        res.status(500).json({ error: 'Failed to get categories', details: error.message })
    }
}

export async function getCategoryById(req, res) {
    try {
        const { id: categoryId } = req.params
        const category = await categoryService.getById(categoryId)
        if (!category) {
            return res.status(404).json({ error: 'Category not found' })
        }
        res.json(category)
    } catch (error) {
        console.error('[Controller] Error getting category by id:', error)
        res.status(500).json({ error: 'Failed to get category', details: error.message })
    }
}

export async function addCategory(req, res) {
    try {
        const category = req.body
        const addedCategory = await categoryService.add(category)
        res.status(201).json(addedCategory)
    } catch (error) {
        console.error('[Controller] Error adding category:', error)
        res.status(500).json({ error: 'Failed to add category', details: error.message })
    }
}

export async function updateCategory(req, res) {
    try {
        const category = req.body
        const categoryId = category._id
        if (!categoryId) {
            return res.status(400).json({ error: 'Category ID is required' })
        }
        const updatedCategory = await categoryService.update(categoryId, category)
        if (!updatedCategory) {
            return res.status(404).json({ error: 'Category not found' })
        }
        res.json(updatedCategory)
    } catch (error) {
        console.error('[Controller] Error updating category:', error)
        res.status(500).json({ error: 'Failed to update category', details: error.message })
    }
}

export async function deleteCategory(req, res) {
    try {
        const { id: categoryId } = req.params
        const deletedCount = await categoryService.remove(categoryId)
        if (deletedCount === 1) {
            res.json({ message: 'Deleted successfully' })
        } else {
            res.status(404).json({ error: 'Category not found' })
        }
    } catch (error) {
        console.error('[Controller] Error deleting category:', error)
        res.status(500).json({ error: 'Failed to delete category', details: error.message })
    }
}
