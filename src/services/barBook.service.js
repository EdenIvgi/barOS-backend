import { httpService } from './http.service'

const BASE_URL = 'barBook/'

/** מבנה ריק של תוכן ספר הבר – ללא דמו דאטה */
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

/** מנקה את כל התוכן בדאטה בייס (מבנה ריק) */
async function clear() {
  const res = await httpService.post(BASE_URL + 'clear')
  return res.content
}
