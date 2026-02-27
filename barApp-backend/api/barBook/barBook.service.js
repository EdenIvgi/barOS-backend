import { barBookModel } from './barBook.model.js'

export const barBookService = {
  getContent,
  saveContent,
  clear,
}

async function getContent(dbName) {
  return barBookModel.get(dbName)
}

async function saveContent(content, dbName) {
  return barBookModel.save(content, dbName)
}

async function clear(dbName) {
  return barBookModel.clear(dbName)
}
