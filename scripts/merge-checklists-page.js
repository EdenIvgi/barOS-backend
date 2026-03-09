/**
 * Merge individual checklist pages into a single 'checklists' page
 * Run with: node scripts/merge-checklists-page.js [dbName]
 */

import { MongoClient } from 'mongodb'
import { config as dotenvConfig } from 'dotenv'
dotenvConfig()

const MONGO_URL = process.env.DB_URL || 'mongodb://localhost:27017'
const TARGET_DB = process.argv[2] || 'bandit_db'

async function run() {
  const client = await MongoClient.connect(MONGO_URL)
  console.log(`[merge] Connected — target: ${TARGET_DB}`)

  try {
    const collection = client.db(TARGET_DB).collection('barBook')
    const doc = await collection.findOne({})
    if (!doc || !Array.isArray(doc.pages)) {
      console.log('[merge] No pages found.'); return
    }

    const checklistPages = doc.pages.filter(p => p.type === 'checklist')
    const otherPages = doc.pages.filter(p => p.type !== 'checklist')

    if (checklistPages.length === 0) {
      console.log('[merge] No checklist pages to merge.'); return
    }

    console.log(`[merge] Found ${checklistPages.length} checklist pages:`)
    checklistPages.forEach(p => console.log(`  - "${p.title}" (${p.items?.length || 0} items)`))

    const mergedPage = {
      _id: `checklists-${Date.now()}`,
      type: 'checklists',
      title: 'צ\'קליסטים',
      lists: checklistPages.map(p => ({
        _id: p._id,
        title: p.title,
        items: p.items || [],
      })),
    }

    // Put the merged page first, then the rest
    const newPages = [mergedPage, ...otherPages]

    await collection.updateOne({ _id: doc._id }, { $set: { pages: newPages, updatedAt: Date.now() } })
    console.log(`\n[merge] ✓ Merged into single "checklists" page with ${mergedPage.lists.length} sub-lists`)
    console.log(`[merge] Total pages now: ${newPages.length}`)
  } finally {
    await client.close()
    console.log('[merge] Done.')
  }
}

run().catch(err => { console.error(err); process.exit(1) })
