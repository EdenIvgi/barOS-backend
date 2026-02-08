import fs from 'fs'
import * as XLSX from 'xlsx'

const filePath = process.argv[2]
if (!filePath) {
  console.error('Usage: node parse-inventory.mjs <path-to-xlsx>')
  process.exit(1)
}

const buf = fs.readFileSync(filePath)
const wb = XLSX.read(buf, { type: 'buffer' })
const firstSheetName = wb.SheetNames[0]
const sheet = wb.Sheets[firstSheetName]
const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

// Find header row (first row with "שם המוצר" or "ספק")
let headerRowIndex = -1
let headers = {}

for (let i = 0; i < rows.length; i++) {
  const row = rows[i]
  const values = Object.values(row)
  // Check if this row contains headers
  if (values.some(v => String(v).includes('שם המוצר') || String(v).includes('ספק'))) {
    headerRowIndex = i
    // Map column names to field names
    Object.keys(row).forEach(key => {
      const value = String(row[key])
      if (value.includes('שם המוצר')) headers.productName = key
      else if (value.includes('ספק')) headers.supplier = key
      else if (value.includes('כמות במלאי')) headers.stockQuantity = key
      else if (value.includes('כמה להזמין')) headers.orderQuantity = key
    })
    break
  }
}

if (headerRowIndex === -1) {
  console.error('Could not find header row')
  process.exit(1)
}

console.log('Headers found:', headers)

// Process data rows (skip header row)
const dataRows = rows.slice(headerRowIndex + 1)
const items = []

// Category mapping - maps emoji/name patterns to category codes
const categoryMapping = {
  '🍷': 'wine',
  'יין': 'wine',
  '🍺': 'alcohol',
  'אלכוהול': 'alcohol',
  '🥤': 'soft_drink',
  'משקאות': 'soft_drink',
  'קולה': 'soft_drink',
  'מים': 'soft_drink',
  'אחר': 'other'
}

let currentCategory = 'wine' // default

for (let i = 0; i < dataRows.length; i++) {
  const row = dataRows[i]

  // Check if this row is a category header (check the product name column)
  const productNameCol = row[headers.productName]
  if (productNameCol) {
    const productNameValue = String(productNameCol).trim()

    // Check if this looks like a category header (contains emoji or category keywords)
    const isCategoryHeader = productNameValue.match(/[\u{1F300}-\u{1F9FF}]/u) ||
      productNameValue.includes('יין') ||
      productNameValue.includes('אלכוהול') ||
      productNameValue.includes('משקאות') ||
      productNameValue.includes('אחר')

    if (isCategoryHeader && (!row[headers.supplier] || String(row[headers.supplier]).trim() === '')) {
      // This is a category header row
      for (const [key, category] of Object.entries(categoryMapping)) {
        if (productNameValue.includes(key)) {
          currentCategory = category
          console.log(`Found category: ${productNameValue} -> ${category}`)
          break
        }
      }
      continue // Skip category header rows
    }
  }

  // Extract item data
  const productName = row[headers.productName] ? String(row[headers.productName]).trim() : ''
  const supplier = row[headers.supplier] ? String(row[headers.supplier]).trim() : ''
  const stockQty = row[headers.stockQuantity] !== undefined && row[headers.stockQuantity] !== ''
    ? Number(row[headers.stockQuantity])
    : 0
  const orderQty = row[headers.orderQuantity] !== undefined && row[headers.orderQuantity] !== ''
    ? Number(row[headers.orderQuantity])
    : null

  // Skip empty rows
  if (!productName || productName === '' || productName.match(/[\u{1F300}-\u{1F9FF}]/u)) continue

  items.push({
    name: productName,
    nameEn: productName, // Will need translation or manual update
    category: currentCategory,
    supplier: supplier,
    stockQuantity: stockQty,
    minStockLevel: orderQty !== null ? orderQty : 0,
    price: 0, // Default, can be updated later
    isAvailable: true,
    description: '',
    imageUrl: '',
    tags: []
  })
}

console.log(`\nProcessed ${items.length} items`)
console.log('\nSample items:')
console.log(JSON.stringify(items.slice(0, 5), null, 2))

// Count by category
const categoryCount = {}
items.forEach(item => {
  categoryCount[item.category] = (categoryCount[item.category] || 0) + 1
})
console.log('\nItems by category:', categoryCount)

// Save to JSON file
const outputPath = '../barApp-backend/data/inventory_update.json'
fs.writeFileSync(outputPath, JSON.stringify(items, null, 2), 'utf8')
console.log(`\nSaved ${items.length} items to ${outputPath}`)
