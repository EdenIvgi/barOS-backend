/**
 * Migration: backfill missing user fields for all users in barapp_master.user
 *
 * Fills in: role, fullname, createdAt, dbName, companyName, companyDisplayName
 *
 * Run: node data/migrate-users.mjs
 */
import 'dotenv/config'
import { MongoClient } from 'mongodb'
import { config } from '../config/index.js'

const MASTER_DB = 'barapp_master'
const COLLECTION = 'user'

function sanitizeDbSegment(name) {
  if (!name || !name.trim()) return null
  const sanitized = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
  return sanitized || null
}

function toDisplayName(slug) {
  if (!slug) return slug
  return slug
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

async function migrate() {
  const client = await MongoClient.connect(config.dbURL)
  const collection = client.db(MASTER_DB).collection(COLLECTION)

  const users = await collection.find({}).toArray()
  console.log(`\nFound ${users.length} user(s) in ${MASTER_DB}.${COLLECTION}\n`)

  let updated = 0
  let skipped = 0

  for (const user of users) {
    const $set = {}

    // ── role ─────────────────────────────────────────────
    if (!user.role) $set.role = 'bartender'

    // ── fullname ──────────────────────────────────────────
    if (!user.fullname) $set.fullname = user.username

    // ── createdAt ─────────────────────────────────────────
    if (!user.createdAt) $set.createdAt = Date.now()

    // ── company / db chain ───────────────────────────────
    let { dbName, companyName, companyDisplayName } = user

    // 1. derive companyName from dbName
    if (!companyName && dbName && !dbName.startsWith('bar_')) {
      companyName = dbName.replace(/_db$/, '')
      $set.companyName = companyName
    }

    // 2. derive dbName from companyName
    if (!dbName && companyName) {
      const segment = sanitizeDbSegment(companyName)
      if (segment) {
        dbName = `${segment}_db`
        $set.dbName = dbName
      }
    }

    // 3. last resort — use username as company identifier
    if (!companyName && !dbName) {
      const segment = sanitizeDbSegment(user.username)
      if (segment) {
        companyName = segment
        dbName = `${segment}_db`
        $set.companyName = companyName
        $set.dbName = dbName
      }
    }

    // 4. derive companyDisplayName
    if (!companyDisplayName && companyName) {
      $set.companyDisplayName = toDisplayName(companyName)
    }

    // ── result ────────────────────────────────────────────
    if (Object.keys($set).length === 0) {
      skipped++
      console.log(`  SKIP   ${user.username}`)
      continue
    }

    await collection.updateOne({ _id: user._id }, { $set })
    updated++
    console.log(`  UPDATE ${user.username} → ${JSON.stringify($set)}`)
  }

  console.log(`\nDone. Updated: ${updated}  |  Skipped (already complete): ${skipped}\n`)
  await client.close()
}

migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
