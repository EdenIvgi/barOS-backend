import { httpService } from './http.service'

const BASE_URL = 'barBook/'

export function getEmptyContent() {
  return { pages: [] }
}

export function createPage(type, title) {
  return {
    _id: crypto.randomUUID(),
    type,
    title,
    ...defaultPageData(type),
  }
}

function defaultPageData(type) {
  switch (type) {
    case 'checklists': return { lists: [] }
    case 'checklist':  return { items: [] }
    case 'daily':      return { tasks: [] }
    case 'stock':      return { headers: [], rows: [] }
    case 'recipes':    return { items: [] }
    default:           return {}
  }
}

export const barBookService = {
  getContent,
  saveContent,
  clear,
  getEmptyContent,
  createPage,
}

async function getContent() {
  return httpService.get(BASE_URL)
}

async function saveContent(content) {
  return httpService.put(BASE_URL, content)
}

async function clear() {
  const res = await httpService.post(BASE_URL + 'clear')
  return res.content ?? res
}
