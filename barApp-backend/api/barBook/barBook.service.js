import { barBookModel } from './barBook.model.js'

export const barBookService = {
  getContent,
  saveContent,
  clear,
}

async function getContent() {
  return barBookModel.get()
}

async function saveContent(content) {
  return barBookModel.save(content)
}

async function clear() {
  return barBookModel.clear()
}
