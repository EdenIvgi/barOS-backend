import { dbService } from '../../services/mongo.service.js'
import { toObjectId } from '../../services/objectId.service.js'

const COLLECTION_NAME = 'recipe'

const DEFAULT_RECIPES = [
  {
    title: 'Cinnamon & Clove Syrup',
    ingredients: ['10 cinnamon sticks', '20 cloves', '3 orange peels', '1kg sugar', '1L water'],
    instructions: [
      'Crush 2 cinnamon sticks into small pieces.',
      'Heat 1L water and sugar in a pot until sugar dissolves.',
      'Add remaining ingredients and simmer on medium heat for 5 minutes.',
      'Reduce to low heat and simmer for 20 more minutes.',
      'Cool in fridge for 30 minutes, then strain through a fine sieve.',
    ],
  },
  {
    title: 'Coriander & Passionfruit Syrup',
    ingredients: ['Sugar water', '4L container of coriander', 'Passionfruit puree'],
    instructions: [
      'Fill blender with coriander heads and 1L sugar water.',
      'Blend and strain through cheesecloth.',
      'Add 0.5L sugar water and a full bottle of passionfruit puree.',
    ],
  },
  {
    title: 'Honey & Ginger Syrup',
    ingredients: ['Ginger', 'Honey', 'Water'],
    instructions: [
      'Blend 1kg of ginger.',
      'Heat 2kg honey and 2L water in a pot until boiling.',
      'Add ginger and bring back to a boil.',
      'Reduce to low heat for about 20 minutes.',
      'Let cool and strain through cheesecloth.',
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
  const collection = await dbService.getCollection(COLLECTION_NAME)
  await ensureDefaultRecipes()
  return collection.find({}).sort({ createdAt: -1 }).toArray()
}

async function getById(recipeId) {
  const collection = await dbService.getCollection(COLLECTION_NAME)
  const objId = toObjectId(recipeId)
  const filter = objId ? { _id: objId } : { _id: recipeId }
  return collection.findOne(filter)
}

async function create(recipeData) {
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
}

async function update(recipeId, updateData) {
  const collection = await dbService.getCollection(COLLECTION_NAME)
  const objId = toObjectId(recipeId)
  const filter = objId ? { _id: objId } : { _id: recipeId }

  const { _id, createdAt, ...rest } = updateData
  const dataToUpdate = {}
  if (rest.title !== undefined) dataToUpdate.title = String(rest.title).trim()
  if (rest.ingredients !== undefined) dataToUpdate.ingredients = Array.isArray(rest.ingredients) ? rest.ingredients : []
  if (rest.instructions !== undefined) dataToUpdate.instructions = Array.isArray(rest.instructions) ? rest.instructions : []
  dataToUpdate.updatedAt = Date.now()

  const result = await collection.updateOne(filter, { $set: dataToUpdate })
  if (result.matchedCount === 0) return null
  return getById(recipeId)
}

async function remove(recipeId) {
  const collection = await dbService.getCollection(COLLECTION_NAME)
  const objId = toObjectId(recipeId)
  const filter = objId ? { _id: objId } : { _id: recipeId }
  const result = await collection.deleteOne(filter)
  return result.deletedCount
}
