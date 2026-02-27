import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { fileURLToPath } from 'url'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const excelFilePath = process.argv[2]

if (!excelFilePath) {
  console.error('Usage: node import_inventory.mjs <path-to-excel-file>')
  console.error('Example: node import_inventory.mjs "c:\\Users\\edena\\Downloads\\bar-managment.xlsx"')
  process.exit(1)
}

async function importInventory() {
  try {
    console.log('Step 1: Parsing Excel file...')
    const frontendDir = path.join(__dirname, '../../barApp-frontend')
    const parseScript = path.join(frontendDir, 'parse-inventory.mjs')

    const { stdout, stderr } = await execAsync(`node "${parseScript}" "${excelFilePath}"`, {
      cwd: frontendDir
    })

    if (stderr) console.error('Parse warnings:', stderr)
    console.log(stdout)

    console.log('\nStep 2: Updating inventory in database...')
    const updateScript = path.join(__dirname, 'update_inventory.mjs')
    const { stdout: updateStdout, stderr: updateStderr } = await execAsync(`node "${updateScript}"`, {
      cwd: __dirname
    })

    if (updateStderr) console.error('Update warnings:', updateStderr)
    console.log(updateStdout)

    console.log('\n✅ Inventory import completed successfully!')

  } catch (error) {
    console.error('Error importing inventory:', error.message)
    if (error.stdout) console.log('Output:', error.stdout)
    if (error.stderr) console.error('Errors:', error.stderr)
    process.exit(1)
  }
}

importInventory()
