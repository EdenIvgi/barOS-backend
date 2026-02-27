import fs from 'fs'
import * as XLSX from 'xlsx'

const filePath = process.argv[2]
if (!filePath) {
  console.error('Usage: node parse-xlsx.mjs <path-to-xlsx>')
  process.exit(1)
}

const buf = fs.readFileSync(filePath)
const wb = XLSX.read(buf, { type: 'buffer' })
const firstSheetName = wb.SheetNames[0]
const sheet = wb.Sheets[firstSheetName]
const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
const headers = rows[0] ? Object.keys(rows[0]) : []

console.log('sheet:', firstSheetName)
console.log('rows:', rows.length)
console.log('headers:', headers)
console.log('sample:', JSON.stringify(rows.slice(0, 10), null, 2))
