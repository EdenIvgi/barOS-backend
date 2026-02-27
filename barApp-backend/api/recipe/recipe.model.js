import { dbService } from '../../services/mongo.service.js'
import { toObjectId } from '../../services/objectId.service.js'

const COLLECTION_NAME = 'recipe'

export const recipeModel = {
  getAll,
  getById,
  create,
  update,
  remove,
}

async function getAll(dbName) {
  const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
  return collection.find({}).sort({ createdAt: -1 }).toArray()
}

async function getById(recipeId, dbName) {
  const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
  const objId = toObjectId(recipeId)
  const filter = objId ? { _id: objId } : { _id: recipeId }
  return collection.findOne(filter)
}

async function create(recipeData, dbName) {
  const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
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

async function update(recipeId, updateData, dbName) {
  const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
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
  return getById(recipeId, dbName)
}

async function remove(recipeId, dbName) {
  const collection = await dbService.getCollection(COLLECTION_NAME, dbName)
  const objId = toObjectId(recipeId)
  const filter = objId ? { _id: objId } : { _id: recipeId }
  const result = await collection.deleteOne(filter)
  return result.deletedCount
}
