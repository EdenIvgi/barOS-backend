/**
 * Make a user admin in barapp_master
 * Run with: node scripts/make-admin.js <username>
 */

import { MongoClient } from 'mongodb'
import { config as dotenvConfig } from 'dotenv'
dotenvConfig()

const MONGO_URL = process.env.DB_URL || 'mongodb://localhost:27017'
const MASTER_DB = 'barapp_master'
const TARGET = process.argv[2]

if (!TARGET) {
  console.error('Usage: node scripts/make-admin.js <username>')
  process.exit(1)
}

async function run() {
  const client = await MongoClient.connect(MONGO_URL)
  try {
    const coll = client.db(MASTER_DB).collection('user')
    const user = await coll.findOne({ username: TARGET })
    if (!user) { console.log(`User "${TARGET}" not found in ${MASTER_DB}`); return }

    console.log(`Found: username=${user.username} role=${user.role || '(none)'}`)
    await coll.updateOne({ username: TARGET }, { $set: { role: 'admin' } })
    console.log(`✓ Set role=admin for "${TARGET}"`)
  } finally {
    await client.close()
  }
}

run().catch(err => { console.error(err); process.exit(1) })
