/**
 * Migration: convert barBook in bandit_db from old fixed-schema to new dynamic pages format
 *
 * Old schema: { checklists: { opening, closing, deep }, dailyTasks, stockTable, recipes }
 * New schema: { pages: [ { _id, type, title, ...typeData } ] }
 *
 * Run with: node scripts/migrate-barbook-to-pages.js [dbName]
 * Default:  node scripts/migrate-barbook-to-pages.js bandit_db
 */

import { MongoClient } from 'mongodb'
import { config as dotenvConfig } from 'dotenv'
dotenvConfig()

const MONGO_URL = process.env.DB_URL || 'mongodb://localhost:27017'
const TARGET_DB = process.argv[2] || 'bandit_db'

function migrateOldFormat(doc) {
  if (Array.isArray(doc.pages) && doc.pages.length > 0) return doc.pages

  const pages = []
  const ts = Date.now()

  // Checklists
  const checklistMap = { opening: 'פתיחה', closing: 'סגירה', deep: 'ניקיון עמוק' }
  for (const [key, fallbackTitle] of Object.entries(checklistMap)) {
    const list = doc.checklists?.[key]
    if (!list) continue
    const items = (list.items || []).filter(Boolean)
    if (!list.title && items.length === 0) continue
    pages.push({
      _id: `migrated-${key}-${ts}`,
      type: 'checklist',
      title: list.title || fallbackTitle,
      items: items.map(text => ({ text: String(text), checked: false })),
    })
  }

  // Daily tasks
  if (Array.isArray(doc.dailyTasks) && doc.dailyTasks.length > 0) {
    pages.push({
      _id: `migrated-daily-${ts}`,
      type: 'daily',
      title: 'משימות יומיות',
      tasks: doc.dailyTasks.map(d => ({ day: d.day || '', task: d.task || '' })),
    })
  }

  // Stock table
  const st = doc.stockTable
  if (st && (st.headers?.length > 0 || st.rows?.length > 0)) {
    pages.push({
      _id: `migrated-stock-${ts}`,
      type: 'stock',
      title: st.title || 'מלאי',
      headers: st.headers || [],
      rows: st.rows || [],
    })
  }

  // Recipes
  if (Array.isArray(doc.recipes) && doc.recipes.length > 0) {
    pages.push({
      _id: `migrated-recipes-${ts}`,
      type: 'recipes',
      title: 'מתכונים',
      items: doc.recipes,
    })
  }

  return pages
}

async function run() {
  const client = await MongoClient.connect(MONGO_URL)
  console.log(`[migrate] Connected to MongoDB`)
  console.log(`[migrate] Target database: ${TARGET_DB}`)

  try {
    const collection = client.db(TARGET_DB).collection('barBook')

    const doc = await collection.findOne({})
    if (!doc) {
      console.log(`[migrate] No barBook document found in ${TARGET_DB} — nothing to migrate.`)
      return
    }

    console.log(`[migrate] Found barBook document: _id=${doc._id}`)
    console.log(`[migrate] Current fields: ${Object.keys(doc).join(', ')}`)

    if (Array.isArray(doc.pages) && doc.pages.length > 0) {
      console.log(`[migrate] Already in new format with ${doc.pages.length} pages — no migration needed.`)
      return
    }

    const hasOldData = doc.checklists || doc.dailyTasks || doc.stockTable || doc.recipes
    if (!hasOldData) {
      console.log(`[migrate] Document has no old-format data to migrate.`)
      if (Array.isArray(doc.pages)) {
        console.log(`[migrate] pages field is empty array — document is blank.`)
      }
      return
    }

    console.log(`[migrate] Old-format fields detected:`)
    if (doc.checklists) console.log(`  - checklists: ${Object.keys(doc.checklists).join(', ')}`)
    if (doc.dailyTasks) console.log(`  - dailyTasks: ${doc.dailyTasks.length} entries`)
    if (doc.stockTable) console.log(`  - stockTable: ${doc.stockTable.headers?.length || 0} cols, ${doc.stockTable.rows?.length || 0} rows`)
    if (doc.recipes) console.log(`  - recipes: ${doc.recipes.length} items`)

    const pages = migrateOldFormat(doc)
    console.log(`\n[migrate] Migrated to ${pages.length} pages:`)
    pages.forEach(p => console.log(`  [${p.type}] "${p.title}"`))

    await collection.updateOne(
      { _id: doc._id },
      { $set: { pages, updatedAt: Date.now() } }
    )

    console.log(`\n[migrate] ✓ Successfully saved ${pages.length} pages to ${TARGET_DB}.barBook`)

  } finally {
    await client.close()
    console.log('[migrate] Done.')
  }
}

run().catch(err => {
  console.error('[migrate] Error:', err)
  process.exit(1)
})
