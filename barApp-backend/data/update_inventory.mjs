import { MongoClient, ObjectId } from 'mongodb'
import { dbConfig } from '../config/db.config.js'
import fs from 'fs'

// Read inventory data from JSON file
const inventoryDataPath = './inventory_update.json'
if (!fs.existsSync(inventoryDataPath)) {
    console.error(`File not found: ${inventoryDataPath}`)
    console.error('Please run parse-inventory.mjs first to generate the inventory file')
    process.exit(1)
}

const inventoryData = JSON.parse(fs.readFileSync(inventoryDataPath, 'utf8'))

async function updateInventory() {
    let client

    try {
        // Connect to MongoDB
        client = new MongoClient(dbConfig.uri, dbConfig.options)
        await client.connect()
        console.log('Connected to MongoDB')

        const db = client.db(dbConfig.dbName)
        const itemsCollection = db.collection('item')

        let updated = 0
        let notFound = 0
        let created = 0

        for (const itemData of inventoryData) {
            // Try to find item by name and supplier (more accurate matching)
            let existingItem = await itemsCollection.findOne({
                name: itemData.name,
                supplier: itemData.supplier
            })

            // If not found by name+supplier, try just by name
            if (!existingItem) {
                existingItem = await itemsCollection.findOne({ name: itemData.name })
            }

            if (existingItem) {
                // Update only stock quantity and min stock level
                const updateData = {
                    stockQuantity: itemData.stockQuantity !== undefined ? itemData.stockQuantity : existingItem.stockQuantity || 0,
                    minStockLevel: itemData.minStockLevel !== undefined ? itemData.minStockLevel : existingItem.minStockLevel || 0,
                    updatedAt: Date.now()
                }

                // Also update supplier if it's different
                if (itemData.supplier && itemData.supplier !== existingItem.supplier) {
                    updateData.supplier = itemData.supplier
                }

                // Also update category if provided
                if (itemData.category && itemData.category !== existingItem.category) {
                    updateData.category = itemData.category
                }

                await itemsCollection.updateOne(
                    { _id: existingItem._id },
                    { $set: updateData }
                )
                updated++
                console.log(`✓ Updated: ${itemData.name} (${itemData.supplier}) - Stock: ${itemData.stockQuantity}, Min: ${itemData.minStockLevel}`)
            } else {
                // Item not found - could create it, but for now just log
                notFound++
                console.log(`✗ Not found: ${itemData.name} (${itemData.supplier})`)

                // Optionally create new item
                // Uncomment the following lines if you want to auto-create missing items
                /*
                const newItem = {
                    name: itemData.name,
                    nameEn: itemData.nameEn || itemData.name,
                    description: itemData.description || '',
                    category: itemData.category || 'other',
                    supplier: itemData.supplier || '',
                    price: itemData.price || 0,
                    imageUrl: itemData.imageUrl || '',
                    isAvailable: true,
                    stockQuantity: itemData.stockQuantity || 0,
                    minStockLevel: itemData.minStockLevel || 0,
                    tags: itemData.tags || [],
                    quantity: null,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                }
                await itemsCollection.insertOne(newItem)
                created++
                console.log(`+ Created: ${itemData.name}`)
                */
            }
        }

        console.log(`\n=== Summary ===`)
        console.log(`Updated: ${updated}`)
        console.log(`Not found: ${notFound}`)
        if (created > 0) console.log(`Created: ${created}`)
        console.log(`\nDone!`)

    } catch (error) {
        console.error('Error updating inventory:', error)
        throw error
    } finally {
        if (client) {
            await client.close()
            console.log('Disconnected from MongoDB')
        }
    }
}

updateInventory().catch(console.error)
