import { dbService } from '../../services/mongo.service.js'
import { ObjectId } from 'mongodb'

const COLLECTION_NAME = 'recipe'

const DEFAULT_RECIPES = [
  {
    title: 'סירופ קינמון וציפורן',
    ingredients: ['10 מקלות קינמון', '20 מקלות ציפורן', '3 קליפות תפוז', 'קילו סוכר', 'ליטר מים'],
    instructions: [
      'נכתוש 2 מקלות קינמון לשברים דקים.',
      'נחמם בסיר ליטר מים וסוכר.',
      'כאשר הסוכר נמס לגמרי נוסיף את שאר המרכיבים. נבשל בטמפרטורה בינונית כ־5 דקות.',
      'לאחר מכן נוריד את הטמפרטורה לחום נמוך (בעבוע קל) למשך 20 דקות נוספות.',
      'נשאיר במקרר למשך כחצי שעה ונסנן במסננת דקה.',
    ],
  },
  {
    title: 'סירופ כוסברה ופסיפלורה',
    ingredients: ['מי סוכר', 'קופסת 4 ליטר של כוסברה', 'מחית פסיפלורה'],
    instructions: [
      'בבלנדר נמלא ראשים של כוסברה וליטר מי סוכר. נשים כוסברה עד שהבלנדר מלא.',
      'נערבל הכל ונסנן עם בד חיתול.',
      'אל התערובת שיצאה נוסיף חצי ליטר מי סוכר ובקבוק שלם של מחית פסיפלורה.',
    ],
  },
  {
    title: 'סירופ דבש וגינגר',
    ingredients: ['ג׳ינג׳ר', 'דבש', 'מים'],
    instructions: [
      'נטחן קילו גינגר בבלנדר.',
      'על סיר אינדוקציה נעלה 2 קילו דבש ו־2 ליטר מים.',
      'נוסיף את הגינגר לסיר ונחמם עד לבעבוע.',
      'נוריד את החום לעוצמה 4 למשך כ־20 דקות.',
      'לאחר מכן ניתן לו להצטנן ונסנן דרך בד חיתול.',
    ],
  },
]

export const recipeModel = {
  getAll,
  getById,
  create,
  update,
  remove,
  ensureDefaultRecipes
}

/** יוצר את קולקשן recipe אם לא קיים, ומשחזר את שלושת המתכונים ההתחלתיים */
async function ensureDefaultRecipes() {
  const collection = await dbService.getCollection(COLLECTION_NAME)
  try {
    await collection.db.createCollection(COLLECTION_NAME)
  } catch (e) {
    if (e.code !== 48) throw e
  }
  const now = Date.now()
  for (const r of DEFAULT_RECIPES) {
    const exists = await collection.findOne({ title: r.title })
    if (exists) continue
    await collection.insertOne({
      title: r.title,
      ingredients: r.ingredients || [],
      instructions: r.instructions || [],
      createdAt: now,
      updatedAt: now
    })
  }
}

async function getAll() {
  try {
    const collection = await dbService.getCollection(COLLECTION_NAME)
    await ensureDefaultRecipes()
    const recipes = await collection.find({}).sort({ createdAt: -1 }).toArray()
    return recipes
  } catch (error) {
    console.error('[RecipeModel] Error getting recipes:', error)
    throw error
  }
}

async function getById(recipeId) {
  try {
    const collection = await dbService.getCollection(COLLECTION_NAME)
    let recipe
    try {
      recipe = await collection.findOne({ _id: ObjectId.createFromHexString(recipeId) })
    } catch {
      recipe = await collection.findOne({ _id: recipeId })
    }
    return recipe
  } catch (error) {
    console.error('[RecipeModel] Error getting recipe by id:', error)
    throw error
  }
}

async function create(recipeData) {
  try {
    const collection = await dbService.getCollection(COLLECTION_NAME)
    const now = Date.now()
    const recipeToAdd = {
      title: (recipeData.title || '').trim(),
      ingredients: Array.isArray(recipeData.ingredients) ? recipeData.ingredients : [],
      instructions: Array.isArray(recipeData.instructions) ? recipeData.instructions : [],
      createdAt: now,
      updatedAt: now
    }
    const result = await collection.insertOne(recipeToAdd)
    recipeToAdd._id = result.insertedId
    return recipeToAdd
  } catch (error) {
    console.error('[RecipeModel] Error creating recipe:', error)
    throw error
  }
}

async function update(recipeId, updateData) {
  try {
    const collection = await dbService.getCollection(COLLECTION_NAME)
    const { _id, createdAt, ...rest } = updateData
    const dataToUpdate = {}
    if (rest.title !== undefined) dataToUpdate.title = String(rest.title).trim()
    if (rest.ingredients !== undefined) dataToUpdate.ingredients = Array.isArray(rest.ingredients) ? rest.ingredients : []
    if (rest.instructions !== undefined) dataToUpdate.instructions = Array.isArray(rest.instructions) ? rest.instructions : []
    dataToUpdate.updatedAt = Date.now()
    let result
    try {
      result = await collection.updateOne(
        { _id: ObjectId.createFromHexString(recipeId) },
        { $set: dataToUpdate }
      )
    } catch {
      result = await collection.updateOne(
        { _id: recipeId },
        { $set: dataToUpdate }
      )
    }
    if (result.matchedCount === 0) return null
    return await getById(recipeId)
  } catch (error) {
    console.error('[RecipeModel] Error updating recipe:', error)
    throw error
  }
}

async function remove(recipeId) {
  try {
    const collection = await dbService.getCollection(COLLECTION_NAME)
    let result
    try {
      result = await collection.deleteOne({ _id: ObjectId.createFromHexString(recipeId) })
    } catch {
      result = await collection.deleteOne({ _id: recipeId })
    }
    return result.deletedCount
  } catch (error) {
    console.error('[RecipeModel] Error removing recipe:', error)
    throw error
  }
}
