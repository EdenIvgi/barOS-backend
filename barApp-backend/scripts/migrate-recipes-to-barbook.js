/**
 * Migration script: Move recipes from recipe collection into barBook document
 *
 * Before: recipes stored in separate 'recipe' collection
 * After: recipes embedded in barBook document as recipes array
 *
 * Run with: node scripts/migrate-recipes-to-barbook.js [dbName]
 * Examples:
 *   node scripts/migrate-recipes-to-barbook.js bandit_db
 *   node scripts/migrate-recipes-to-barbook.js bar_123abc
 */

import { MongoClient } from 'mongodb'
import { config as dotenvConfig } from 'dotenv'
dotenvConfig()

const MONGO_URL = process.env.DB_URL || process.env.MONGO_URL || 'mongodb://localhost:27017'
const TARGET_DB = process.argv[2] || 'bandit_db'

async function run() {
    const client = await MongoClient.connect(MONGO_URL)
    console.log(`[migrate] Connected to MongoDB`)

    try {
        const db = client.db(TARGET_DB)
        const recipeCollection = db.collection('recipe')
        const barBookCollection = db.collection('barBook')

        // Check if recipe collection exists and has data
        const recipeCount = await recipeCollection.countDocuments()
        if (recipeCount === 0) {
            console.log(`[migrate] Database "${TARGET_DB}": No recipes to migrate (recipe collection is empty or doesn't exist)`)
            return
        }

        console.log(`[migrate] Found ${recipeCount} recipes in "${TARGET_DB}.recipe" collection`)

        // Get all recipes
        const recipes = await recipeCollection.find({}).toArray()
        console.log(`[migrate] Retrieved ${recipes.length} recipes`)

        // Get or create barBook document
        let barBookDoc = await barBookCollection.findOne({ slug: 'default' })
        if (!barBookDoc) {
            console.log(`[migrate] Creating new barBook document...`)
            await barBookCollection.insertOne({
                slug: 'default',
                checklists: {
                    opening: { title: '', items: [] },
                    closing: { title: '', items: [] },
                    deep: { title: '', items: [] },
                },
                dailyTasks: [],
                stockTable: { title: '', headers: [], rows: [] },
                recipes: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
            })
            barBookDoc = await barBookCollection.findOne({ slug: 'default' })
        }

        // Migrate recipes
        const migratedRecipes = recipes.map(r => ({
            _id: r._id?.toString?.() || r._id,
            title: r.title || '',
            ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
            instructions: Array.isArray(r.instructions) ? r.instructions : [],
            createdAt: r.createdAt || Date.now(),
            updatedAt: r.updatedAt || Date.now(),
        }))

        // Update barBook with recipes
        await barBookCollection.updateOne(
            { slug: 'default' },
            {
                $set: {
                    recipes: migratedRecipes,
                    updatedAt: Date.now(),
                }
            }
        )

        console.log(`[migrate] Successfully migrated ${migratedRecipes.length} recipes into barBook document for "${TARGET_DB}"`)
        console.log(`[migrate] Recipes are now stored in "${TARGET_DB}.barBook" as a sub-section`)

    } catch (err) {
        console.error('[migrate] Error:', err.message)
        process.exit(1)
    } finally {
        await client.close()
        console.log('[migrate] Done.')
    }
}

run().catch(err => {
    console.error('[migrate] Fatal error:', err)
    process.exit(1)
})
