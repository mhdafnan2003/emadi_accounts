/*
  Usage:
    node scripts/add-revenue.js --amount=1000 --yes

  Optional:
    --branchId=<mongoObjectId>
    --vehicleId=<string>
    --vehicleName=<string>
    --date=YYYY-MM-DD
    --title="Manual Revenue Adjustment"
    --category="Adjustment"
    --description="Added via script"

  Notes:
    - Requires MONGODB_URI in environment (same as the app).
    - Inserts a document into the `expenses` collection with expenseType: 'revenue'.
*/

const { MongoClient, ObjectId } = require('mongodb')
const fs = require('fs')
const path = require('path')

function loadEnvLocal() {
  // Minimal .env.local loader (no external deps)
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return

  const content = fs.readFileSync(envPath, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

function getArgValue(name) {
  const prefix = `--${name}=`
  const hit = process.argv.find(a => a.startsWith(prefix))
  if (!hit) return undefined
  return hit.slice(prefix.length)
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`)
}

function parseLocalDateOnly(value) {
  if (!value) return null
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  const d = new Date(year, month - 1, day)
  return Number.isNaN(d.getTime()) ? null : d
}

async function main() {
  loadEnvLocal()
  const mongoUri = process.env.MONGODB_URI
  if (!mongoUri) {
    console.error('Missing MONGODB_URI. Set it in your environment (or .env.local for the app).')
    process.exit(1)
  }

  if (!hasFlag('yes')) {
    console.error('Refusing to write to DB without --yes')
    console.error('Example: node scripts/add-revenue.js --amount=1000 --yes')
    process.exit(1)
  }

  const amountRaw = getArgValue('amount') || '1000'
  const amount = Number(amountRaw)
  if (!Number.isFinite(amount) || amount <= 0) {
    console.error('Invalid --amount. Provide a positive number.')
    process.exit(1)
  }

  const branchIdRaw = getArgValue('branchId')
  const vehicleId = getArgValue('vehicleId')
  const vehicleName = getArgValue('vehicleName')

  const dateStr = getArgValue('date')
  const date = dateStr ? parseLocalDateOnly(dateStr) : new Date()
  if (!date) {
    console.error('Invalid --date. Use YYYY-MM-DD.')
    process.exit(1)
  }

  const title = getArgValue('title') || 'Manual Revenue Adjustment'
  const category = getArgValue('category') || 'Adjustment'
  const description = getArgValue('description') || 'Added via script'

  let branchId
  if (branchIdRaw) {
    try {
      branchId = new ObjectId(branchIdRaw)
    } catch {
      console.error('Invalid --branchId. Must be a Mongo ObjectId.')
      process.exit(1)
    }
  }

  const client = new MongoClient(mongoUri)
  await client.connect()
  try {
    const db = client.db()
    const now = new Date()

    const doc = {
      title,
      amount,
      category,
      description,
      date,
      expenseType: 'revenue',
      ...(branchId ? { branchId } : {}),
      ...(vehicleId ? { vehicleId: String(vehicleId) } : {}),
      ...(vehicleName ? { vehicleName: String(vehicleName) } : {}),
      createdAt: now,
      updatedAt: now,
    }

    const res = await db.collection('expenses').insertOne(doc)
    console.log('Inserted revenue expense:', res.insertedId.toString())
    console.log('Amount:', amount)
  } finally {
    await client.close()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
