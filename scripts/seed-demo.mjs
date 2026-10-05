/**
 * Seed demo data into a single tenant database.
 * Usage: node scripts/seed-demo.mjs <dbName>
 * Safety: refuses to run without an explicit dbName argument.
 *
 * The data itself lives in services/demoSeed.service.js, which the demo login
 * endpoint uses too, so a demo started from the app and one seeded from here are
 * the same bar.
 */
import 'dotenv/config'
import { MongoClient } from 'mongodb'
import { seedDemoData } from '../services/demoSeed.service.js'

const dbName = process.argv[2]
if (!dbName) {
    console.error('Refusing to run: pass a target dbName, e.g. node scripts/seed-demo.mjs testi_db')
    process.exit(1)
}

const client = await MongoClient.connect(process.env.DB_URL)
console.log(`Seeding demo data into "${dbName}"...`)
await seedDemoData(client.db(dbName))
await client.close()
console.log('Done.')
