import { httpService } from './http.service'

const BASE_URL = 'barBook/'

/** Empty bar book content structure (no demo data). */
export function getEmptyContent() {
  return {
    checklists: {
      opening: { title: '', items: [] },
      closing: { title: '', items: [] },
      deep: { title: '', items: [] },
    },
    dailyTasks: [],
    stockTable: { title: '', headers: [], rows: [] },
  }
}

export const barBookService = {
  getContent,
  saveContent,
  clear,
  getEmptyContent,
}

async function getContent() {
  return httpService.get(BASE_URL)
}

async function saveContent(content) {
  return httpService.put(BASE_URL, content)
}

/** Clears all bar book content in DB (empty structure). */
async function clear() {
  const res = await httpService.post(BASE_URL + 'clear')
  return res.content
}
