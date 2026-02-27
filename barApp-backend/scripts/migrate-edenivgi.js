/**
 * Migration script: Add edenivgi user to barapp_master
 * Links the existing user to the old bandit_db database.
 *
 * Run with: node scripts/migrate-edenivgi.js
 */

import { MongoClient } from 'mongodb'
import { config as dotenvConfig } from 'dotenv'
dotenvConfig()

const MONGO_URL = process.env.DB_URL || process.env.MONGO_URL || 'mongodb://localhost:27017'
const MASTER_DB = 'barapp_master'
const OLD_DB = 'bandit_db'
const TARGET_USERNAME = 'edenivgi'

async function run() {
    const client = await MongoClient.connect(MONGO_URL)
    console.log('[migrate] Connected to MongoDB')

    try {
        const oldUser = await client.db(OLD_DB).collection('user').findOne({ username: TARGET_USERNAME })
        if (!oldUser) {
            console.log(`[migrate] User "${TARGET_USERNAME}" not found in ${OLD_DB}.user — nothing to do.`)
            return
        }
        console.log(`[migrate] Found user in ${OLD_DB}:`, { _id: oldUser._id, username: oldUser.username, role: oldUser.role })

        const masterColl = client.db(MASTER_DB).collection('user')
        const existing = await masterColl.findOne({ username: TARGET_USERNAME })
        if (existing) {
            console.log(`[migrate] User "${TARGET_USERNAME}" already exists in ${MASTER_DB}.user — updating dbName field.`)
            await masterColl.updateOne(
                { username: TARGET_USERNAME },
                { $set: { dbName: OLD_DB, barId: existing.barId || existing._id.toString() } }
            )
            console.log('[migrate] Updated existing master user with dbName =', OLD_DB)
            return
        }

        // Insert the user into barapp_master, preserving their _id, and adding dbName
        const userToInsert = {
            ...oldUser,
            barId: oldUser._id.toString(),
            dbName: OLD_DB,   // tells the middleware to use bandit_db instead of bar_<barId>
        }

        await masterColl.insertOne(userToInsert)
        console.log(`[migrate] Inserted "${TARGET_USERNAME}" into ${MASTER_DB}.user with dbName="${OLD_DB}"`)

    } finally {
        await client.close()
        console.log('[migrate] Done.')
    }
}

run().catch(err => {
    console.error('[migrate] Error:', err)
    process.exit(1)
})
