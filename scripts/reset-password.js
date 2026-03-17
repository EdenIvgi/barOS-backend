/**
 * Reset a user's password in barapp_master
 * Run with: node scripts/reset-password.js <username> <newPassword>
 */

import { MongoClient } from 'mongodb'
import bcrypt from 'bcrypt'
import { config as dotenvConfig } from 'dotenv'
dotenvConfig()

const MONGO_URL = process.env.DB_URL || 'mongodb://localhost:27017'
const MASTER_DB = 'barapp_master'
const [,, TARGET, NEW_PASSWORD] = process.argv

if (!TARGET || !NEW_PASSWORD) {
  console.error('Usage: node scripts/reset-password.js <username> <newPassword>')
  process.exit(1)
}

async function run() {
  const client = await MongoClient.connect(MONGO_URL)
  try {
    const coll = client.db(MASTER_DB).collection('user')
    const user = await coll.findOne({ username: TARGET })
    if (!user) { console.log(`User "${TARGET}" not found`); return }

    const hashed = await bcrypt.hash(NEW_PASSWORD, 10)
    await coll.updateOne({ username: TARGET }, { $set: { password: hashed } })
    console.log(`✓ Password reset for "${TARGET}"`)
  } finally {
    await client.close()
  }
}

run().catch(err => { console.error(err); process.exit(1) })
