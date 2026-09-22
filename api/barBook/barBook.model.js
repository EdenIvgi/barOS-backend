import { dbService } from '../../services/mongo.service.js'

const COLLECTION_NAME = 'barBook'

export const barBookModel = { get, save, clear }

// ─── Migration: old fixed-schema → dynamic pages ───────
function migrateOldFormat(doc) {
  // Already in new format and has content — skip
  if (Array.isArray(doc.pages) && doc.pages.length > 0) return doc.pages

  const pages = []
  const ts = Date.now()

  // Checklists — merge all into a single 'checklists' page with sub-lists
  const checklistMap = { opening: 'פתיחה', closing: 'סגירה', deep: 'ניקיון עמוק' }
  const subLists = []
  for (const [key, fallbackTitle] of Object.entries(checklistMap)) {
    const list = doc.checklists?.[key]
    if (!list) continue
    const items = (list.items || []).filter(Boolean)
    if (!list.title && items.length === 0) continue
    subLists.push({
      _id: `migrated-${key}-${ts}`,
      title: list.title || fallbackTitle,
      items: items.map(text => ({ text: String(text), checked: false })),
    })
  }
  if (subLists.length > 0) {
    pages.push({ _id: `migrated-checklists-${ts}`, type: 'checklists', title: "צ'קליסטים", lists: subLists })
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

async function get(dbName) {
  const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
  const doc = await collection.findOne({})
  if (!doc) return { _id: 'barBook', pages: [], createdAt: Date.now(), updatedAt: Date.now() }

  const { _id, ...rest } = doc
  const pages = migrateOldFormat(rest)

  // Persist migration if old format (no pages field, or pages was empty but old data exists)
  const hasOldData = rest.checklists || rest.dailyTasks || rest.stockTable || rest.recipes
  const needsMigration = !Array.isArray(rest.pages) || (rest.pages.length === 0 && hasOldData)
  if (needsMigration && pages.length > 0) {
    await collection.updateOne({ _id }, { $set: { pages, updatedAt: Date.now() } })
  }

  return { _id: _id?.toString?.() || 'barBook', ...rest, pages }
}

async function save(content, dbName) {
  const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
  const { _id, createdAt, updatedAt, baseUpdatedAt, ...payload } = content || {}
  const now = Date.now()

  const dataToSave = {
    pages: Array.isArray(payload.pages) ? payload.pages : [],
    updatedAt: now,
  }

  const existing = await collection.findOne({})
  if (existing) {
    // Optimistic concurrency: this save replaces the whole document, so a client
    // working from a stale copy would silently wipe another user's edits.
    // baseUpdatedAt is the version the client loaded — refuse if it has moved on.
    if (baseUpdatedAt !== undefined && existing.updatedAt && baseUpdatedAt !== existing.updatedAt) {
      const err = new Error('Bar book was modified by someone else')
      err.status = 409
      throw err
    }
    await collection.updateOne({ _id: existing._id }, { $set: dataToSave })
  } else {
    dataToSave.createdAt = now
    await collection.insertOne(dataToSave)
  }

  return get(dbName)
}

async function clear(dbName) {
  return save({ pages: [] }, dbName)
}
