import { dbService } from '../../services/mongo.service.js'
import { imageStore } from '../../services/imageStore.service.js'

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

/**
 * Every image this book points at.
 *
 * Gallery pages hold uploads; other formats may carry a pasted external address,
 * which is not ours to delete and is skipped by the id match.
 */
function collectImageIds(pages) {
  const ids = new Set()
  const ID_IN_URL = /^\/api\/image\/([a-f0-9]{24})$/i

  for (const page of pages || []) {
    for (const photo of page.photos || []) {
      const match = ID_IN_URL.exec(photo.imageUrl || '')
      if (match) ids.add(match[1])
    }
  }
  return ids
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

  // Storage here is the database, so a photo nothing points at is wasted quota.
  // The document being replaced is already in hand for the conflict check, and
  // the difference between the two is exactly what was removed.
  if (existing) {
    const before = collectImageIds(existing.pages)
    const after = collectImageIds(dataToSave.pages)
    const dropped = [...before].filter(id => !after.has(id))
    if (dropped.length > 0) {
      imageStore.deleteImages(dbName, dropped)
        .catch(err => console.error('failed to remove unused bar book images', err?.message))
    }
  }

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
