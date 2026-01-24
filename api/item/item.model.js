import { dbService } from '../../services/mongo.service.js'
import { ObjectId } from 'mongodb'

const COLLECTION_NAME = 'items'

export const itemModel = {
    getAll,
    getById,
    create,
    update,
    remove,
    updateStock
}

async function getAll(filterBy = {}) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const categoryCollection = await dbService.getCollection('category')
        
        const criteria = {}
        
        // Text search - search in name, nameEn, description, and supplier
        if (filterBy.txt) {
            criteria.$or = [
                { name: { $regex: filterBy.txt, $options: 'i' } },
                { nameEn: { $regex: filterBy.txt, $options: 'i' } },
                { description: { $regex: filterBy.txt, $options: 'i' } },
                { supplier: { $regex: filterBy.txt, $options: 'i' } }
            ]
        }
        
        // Category filter - support both categoryId (ObjectId) and category (string)
        if (filterBy.categoryId) {
            try {
                // Try as ObjectId first
                criteria.categoryId = ObjectId.createFromHexString(filterBy.categoryId)
            } catch (e) {
                // If not a valid ObjectId, try as string category
                criteria.$or = [
                    { categoryId: filterBy.categoryId },
                    { category: filterBy.categoryId }
                ]
            }
        } else if (filterBy.category) {
            criteria.category = filterBy.category
        }
        
        // Supplier filter
        if (filterBy.supplier) {
            criteria.supplier = filterBy.supplier
        }
        
        // Availability filter
        if (filterBy.isAvailable !== null && filterBy.isAvailable !== undefined) {
            criteria.isAvailable = filterBy.isAvailable === 'true' || filterBy.isAvailable === true
        }
        
        // Price filters
        if (filterBy.minPrice || filterBy.maxPrice) {
            criteria.price = {}
            if (filterBy.minPrice) {
                criteria.price.$gte = Number(filterBy.minPrice)
            }
            if (filterBy.maxPrice) {
                criteria.price.$lte = Number(filterBy.maxPrice)
            }
        }

        const items = await collection.find(criteria).sort({ name: 1 }).toArray()
        
        // Populate category for each item
        const itemsWithCategory = await Promise.all(items.map(async (item) => {
            let category = null
            
            // Try to load category by categoryId or category string
            const categoryIdentifier = item.categoryId || item.category
            
            if (categoryIdentifier) {
                // First try as ObjectId
                if (typeof categoryIdentifier === 'object' || (typeof categoryIdentifier === 'string' && categoryIdentifier.length === 24)) {
                    try {
                        const categoryIdObj = typeof categoryIdentifier === 'string' 
                            ? ObjectId.createFromHexString(categoryIdentifier) 
                            : categoryIdentifier
                        category = await categoryCollection.findOne({ _id: categoryIdObj })
                    } catch (e) {
                        // Not a valid ObjectId, continue to try as name
                    }
                }
                
                // If not found, try as name (string)
                if (!category && typeof categoryIdentifier === 'string') {
                    category = await categoryCollection.findOne({ name: categoryIdentifier })
                    if (!category) {
                        category = await categoryCollection.findOne({ nameEn: categoryIdentifier })
                    }
                }
                
                if (category) {
                    item.category = {
                        _id: category._id,
                        name: category.name,
                        nameEn: category.nameEn,
                        icon: category.icon || '',
                        order: category.order || 0,
                        isActive: category.isActive !== false
                    }
                }
            }
            
            return item
        }))
        
        return itemsWithCategory
    } catch (error) {
        console.error('[ItemModel] Error getting items:', error)
        throw error
    }
}

async function getById(itemId) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const categoryCollection = await dbService.getCollection('category')
        
        let item
        try {
            item = await collection.findOne({ _id: ObjectId.createFromHexString(itemId) })
        } catch {
            item = await collection.findOne({ _id: itemId })
        }
        
        if (!item) return null
        
        // Populate category if categoryId or category exists
        const categoryIdentifier = item.categoryId || item.category
        
        if (categoryIdentifier) {
            let category = null
            
            // First try as ObjectId
            if (typeof categoryIdentifier === 'object' || (typeof categoryIdentifier === 'string' && categoryIdentifier.length === 24)) {
                try {
                    const categoryIdObj = typeof categoryIdentifier === 'string' 
                        ? ObjectId.createFromHexString(categoryIdentifier) 
                        : categoryIdentifier
                    category = await categoryCollection.findOne({ _id: categoryIdObj })
                } catch (e) {
                    // Not a valid ObjectId, continue to try as name
                }
            }
            
            // If not found, try as name (string)
            if (!category && typeof categoryIdentifier === 'string') {
                category = await categoryCollection.findOne({ name: categoryIdentifier })
                if (!category) {
                    category = await categoryCollection.findOne({ nameEn: categoryIdentifier })
                }
            }
            
            if (category) {
                item.category = {
                    _id: category._id,
                    name: category.name,
                    nameEn: category.nameEn,
                    icon: category.icon || '',
                    order: category.order || 0,
                    isActive: category.isActive !== false
                }
            }
        }
        
        return item
    } catch (error) {
        console.error('[ItemModel] Error getting item by id:', error)
        throw error
    }
}

async function create(itemData) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        
        const itemToAdd = {
            name: itemData.name || '',
            nameEn: itemData.nameEn || itemData.name || '',
            description: itemData.description || '',
            supplier: itemData.supplier || '',
            price: itemData.price !== undefined ? Number(itemData.price) : 0,
            imageUrl: itemData.imageUrl || '',
            isAvailable: itemData.isAvailable !== undefined ? itemData.isAvailable : true,
            stockQuantity: itemData.stockQuantity !== undefined ? itemData.stockQuantity : (itemData.quantity || 0),
            minStockLevel: itemData.minStockLevel !== undefined ? itemData.minStockLevel : 0,
            tags: itemData.tags || [],
            quantity: itemData.quantity !== undefined ? itemData.quantity : null,
            createdAt: Date.now(),
            updatedAt: Date.now()
        }

        // Handle categoryId - try to find category and save both categoryId (ObjectId) and category (string)
        const categoryCollection = await dbService.getCollection('category')
        let category = null
        const categoryIdentifier = itemData.categoryId || itemData.category
        
        if (categoryIdentifier) {
            // First try as ObjectId
            if (typeof categoryIdentifier === 'object' || (typeof categoryIdentifier === 'string' && categoryIdentifier.length === 24)) {
                try {
                    const categoryIdObj = typeof categoryIdentifier === 'string' 
                        ? ObjectId.createFromHexString(categoryIdentifier) 
                        : categoryIdentifier
                    category = await categoryCollection.findOne({ _id: categoryIdObj })
                    if (category) {
                        itemToAdd.categoryId = category._id
                        itemToAdd.category = category.name // Keep string for backward compatibility
                    }
                } catch (e) {
                    // Not a valid ObjectId, continue to try as name
                }
            }
            
            // If not found, try as name (string)
            if (!category && typeof categoryIdentifier === 'string') {
                category = await categoryCollection.findOne({ name: categoryIdentifier })
                if (!category) {
                    category = await categoryCollection.findOne({ nameEn: categoryIdentifier })
                }
                if (category) {
                    itemToAdd.categoryId = category._id
                    itemToAdd.category = category.name // Keep string for backward compatibility
                } else {
                    // If category not found, save as string
                    itemToAdd.category = categoryIdentifier
                }
            }
        }

        const result = await collection.insertOne(itemToAdd)
        itemToAdd._id = result.insertedId

        // Populate embedded category object
        if (category) {
            itemToAdd.category = {
                _id: category._id,
                name: category.name,
                nameEn: category.nameEn,
                icon: category.icon || '',
                order: category.order || 0,
                isActive: category.isActive !== false
            }
        } else if (itemToAdd.categoryId) {
            // Try to load category by categoryId if we have it
            try {
                category = await categoryCollection.findOne({ _id: itemToAdd.categoryId })
                if (category) {
                    itemToAdd.category = {
                        _id: category._id,
                        name: category.name,
                        nameEn: category.nameEn,
                        icon: category.icon || '',
                        order: category.order || 0,
                        isActive: category.isActive !== false
                    }
                }
            } catch (e) {
                // Category not found
            }
        }

        return itemToAdd
    } catch (error) {
        console.error('[ItemModel] Error creating item:', error)
        throw error
    }
}

async function update(itemId, updateData) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        
        const itemToUpdate = {
            name: updateData.name,
            nameEn: updateData.nameEn || updateData.name,
            description: updateData.description || '',
            supplier: updateData.supplier || '',
            price: updateData.price !== undefined ? Number(updateData.price) : 0,
            imageUrl: updateData.imageUrl || '',
            isAvailable: updateData.isAvailable !== undefined ? updateData.isAvailable : true,
            stockQuantity: updateData.stockQuantity !== undefined ? updateData.stockQuantity : 0,
            minStockLevel: updateData.minStockLevel !== undefined ? updateData.minStockLevel : 0,
            tags: updateData.tags || [],
            quantity: updateData.quantity !== undefined ? updateData.quantity : null,
            updatedAt: Date.now()
        }

        // Handle categoryId (ObjectId) or category (string)
        if (updateData.categoryId) {
            try {
                itemToUpdate.categoryId = ObjectId.createFromHexString(updateData.categoryId)
                delete itemToUpdate.category // Remove category string if categoryId is set
            } catch (e) {
                itemToUpdate.category = updateData.categoryId
                delete itemToUpdate.categoryId
            }
        } else if (updateData.category) {
            itemToUpdate.category = updateData.category
            delete itemToUpdate.categoryId
        }
        
        let result
        try {
            result = await collection.updateOne(
                { _id: ObjectId.createFromHexString(itemId) },
                { $set: itemToUpdate }
            )
        } catch {
            // Try as string ID
            result = await collection.updateOne(
                { _id: itemId },
                { $set: itemToUpdate }
            )
        }
        
        if (result.matchedCount === 0) {
            return null
        }
        
        // getById will populate the category
        return await getById(itemId)
    } catch (error) {
        console.error('[ItemModel] Error updating item:', error)
        throw error
    }
}

async function updateStock(itemId, quantity) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        
        let result
        try {
            result = await collection.updateOne(
                { _id: ObjectId.createFromHexString(itemId) },
                { $set: { stockQuantity: quantity, updatedAt: Date.now() } }
            )
        } catch {
            result = await collection.updateOne(
                { _id: itemId },
                { $set: { stockQuantity: quantity, updatedAt: Date.now() } }
            )
        }
        
        if (result.matchedCount === 0) {
            return null
        }
        
        return await getById(itemId)
    } catch (error) {
        console.error('[ItemModel] Error updating stock:', error)
        throw error
    }
}

async function remove(itemId) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        let result
        try {
            result = await collection.deleteOne({ _id: ObjectId.createFromHexString(itemId) })
        } catch {
            result = await collection.deleteOne({ _id: itemId })
        }
        return result.deletedCount
    } catch (error) {
        console.error('[ItemModel] Error removing item:', error)
        throw error
    }
}
