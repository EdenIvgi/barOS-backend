import { MongoClient, ObjectId } from 'mongodb'
import { dbConfig } from '../config/db.config.js'
import itemsData from './items_updated.json' assert { type: 'json' }

async function updateItems() {
    let client

    try {
        // Connect to MongoDB
        client = new MongoClient(dbConfig.uri, dbConfig.options)
        await client.connect()
        console.log('Connected to MongoDB')

        const db = client.db(dbConfig.dbName)
        const itemsCollection = db.collection('item')

        // First, let's check if we need to create categories
        const categoriesCollection = db.collection('category')
        const existingCategories = await categoriesCollection.find({}).toArray()
        const categoryMap = {}

        // Create category map from existing categories
        existingCategories.forEach(cat => {
            categoryMap[cat.name] = cat._id
        })

        // Create missing categories
        const categoriesToCreate = ['wine', 'alcohol', 'soft_drink', 'other']
        for (const catName of categoriesToCreate) {
            if (!categoryMap[catName]) {
                const newCategory = {
                    name: catName,
                    nameEn: catName,
                    icon: '',
                    order: categoriesToCreate.indexOf(catName) + 1,
                    isActive: true,
                    createdAt: Date.now()
                }
                const result = await categoriesCollection.insertOne(newCategory)
                categoryMap[catName] = result.insertedId
                console.log(`Created category: ${catName}`)
            }
        }

        // Update all items
        let updated = 0
        let created = 0

        for (const itemData of itemsData) {
            // Find existing item by name (or create new)
            const existingItem = await itemsCollection.findOne({ name: itemData.name })

            const itemToUpdate = {
                name: itemData.name,
                nameEn: itemData.nameEn || itemData.name,
                description: itemData.description || '',
                categoryId: categoryMap[itemData.category] || null,
                category: itemData.category, // Keep original category string
                supplier: itemData.supplier || '',
                price: itemData.price !== undefined ? itemData.price : 0,
                imageUrl: itemData.imageUrl || '',
                isAvailable: itemData.isAvailable !== undefined ? itemData.isAvailable : true,
                stockQuantity: itemData.stockQuantity !== undefined ? itemData.stockQuantity : (itemData.quantity || 0),
                minStockLevel: itemData.minStockLevel !== undefined ? itemData.minStockLevel : 0,
                tags: itemData.tags || [],
                quantity: itemData.quantity !== undefined ? itemData.quantity : null,
                updatedAt: Date.now()
            }

            if (existingItem) {
                // Update existing item
                await itemsCollection.updateOne(
                    { _id: existingItem._id },
                    { $set: itemToUpdate }
                )
                updated++
                console.log(`Updated: ${itemData.name}`)
            } else {
                // Create new item
                itemToUpdate.createdAt = Date.now()
                await itemsCollection.insertOne(itemToUpdate)
                created++
                console.log(`Created: ${itemData.name}`)
            }
        }

        console.log(`\nDone! Updated: ${updated}, Created: ${created}`)

    } catch (error) {
        console.error('Error updating items:', error)
        throw error
    } finally {
        if (client) {
            await client.close()
            console.log('Disconnected from MongoDB')
        }
    }
}

updateItems().catch(console.error)
