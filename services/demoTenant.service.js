import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { dbService } from './mongo.service.js'
import { seedDemoData } from './demoSeed.service.js'

const USER_COLLECTION = 'user'
const COMPANY_COLLECTION = 'company'

const DB_PREFIX = 'demo_'
const TTL_MS = 2 * 60 * 60 * 1000   // a demo nobody has touched for two hours is over
const MAX_LIVE = 25                 // the ceiling on how much a public button can create

/**
 * Disposable bars for people trying the app.
 *
 * Each demo session gets its own tenant rather than sharing one, because the two
 * things asked of a public demo — that anyone can start one, and that every one
 * starts from the same known state — cannot both hold on shared data. A shared
 * tenant reset on each login means the second visitor wipes the first mid-session,
 * which under public traffic is the normal case.
 *
 * The cost of per-visitor tenants is that an unauthenticated button creates
 * databases, so the lifecycle here is what keeps that bounded: expired demos are
 * swept on the next demo start, and past a ceiling the oldest is reclaimed rather
 * than another created. Nothing is scheduled; the work rides on the next request.
 */
export const demoTenantService = { createDemoSession, sweepExpired, DB_PREFIX, TTL_MS, MAX_LIVE }

function randomSuffix() {
    return crypto.randomBytes(5).toString('hex')
}

/**
 * Demo tenants are identified by a flag on their company record as well as the
 * database prefix, so a real bar that happens to be named "demo" can never be
 * swept.
 */
async function listDemoCompanies() {
    const companies = await dbService.getMasterCollection(COMPANY_COLLECTION)
    return companies
        .find({ isDemo: true, dbName: { $regex: `^${DB_PREFIX}` } })
        .sort({ createdAt: 1 })
        .toArray()
}

async function destroyDemo(dbName) {
    if (!dbName?.startsWith(DB_PREFIX)) {
        throw new Error(`refusing to destroy a database that is not a demo: ${dbName}`)
    }
    const users = await dbService.getMasterCollection(USER_COLLECTION)
    const companies = await dbService.getMasterCollection(COMPANY_COLLECTION)

    await users.deleteMany({ dbName, isDemo: true })
    await companies.deleteMany({ dbName, isDemo: true })
    const db = await dbService.getDb(dbName)
    await db.dropDatabase()
}

/** Drops demo tenants past their time to live. Returns how many went. */
async function sweepExpired() {
    const cutoff = Date.now() - TTL_MS
    const expired = (await listDemoCompanies()).filter(c => (c.createdAt || 0) < cutoff)
    for (const company of expired) {
        try {
            await destroyDemo(company.dbName)
        } catch (err) {
            // One stubborn tenant should not stop a visitor getting a demo.
            console.error('demo sweep failed for', company.dbName, err?.message)
        }
    }
    return expired.length
}

/** Keeps the number of live demos under the ceiling by reclaiming the oldest. */
async function enforceCap() {
    const live = await listDemoCompanies()
    const excess = live.length - (MAX_LIVE - 1)
    for (let i = 0; i < excess; i++) {
        try {
            await destroyDemo(live[i].dbName)
        } catch (err) {
            console.error('demo reclaim failed for', live[i].dbName, err?.message)
        }
    }
}

/**
 * Builds a fresh demo bar and the account that owns it.
 *
 * The account is a real user row with a hashed random password nobody is ever
 * told: the demo is not a special case in the auth middleware, so it cannot
 * weaken the path real logins take.
 */
async function createDemoSession() {
    await sweepExpired()
    await enforceCap()

    const suffix = randomSuffix()
    const dbName = `${DB_PREFIX}${suffix}_db`
    const username = `demo_${suffix}`
    const now = Date.now()

    const users = await dbService.getMasterCollection(USER_COLLECTION)
    const companies = await dbService.getMasterCollection(COMPANY_COLLECTION)

    try {
        await companies.insertOne({
            dbName,
            companyName: 'demo',
            companyDisplayName: 'Demo Bar',
            isDemo: true,
            createdAt: now,
            updatedAt: now,
        })

        const user = {
            username,
            fullname: 'Demo',
            password: await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10),
            role: 'admin',
            dbName,
            companyName: 'demo',
            companyDisplayName: 'Demo Bar',
            isDemo: true,
            createdAt: now,
        }
        const res = await users.insertOne(user)

        const db = await dbService.getDb(dbName)
        await seedDemoData(db)

        // A demo arrives with a full bar, so offering to set one up is noise.
        await db.collection('setup').insertOne({
            status: 'done',
            steps: { book: true, suppliers: true, products: true, team: true },
            updatedAt: now,
        })

        return {
            _id: res.insertedId.toString(),
            username,
            fullname: user.fullname,
            role: user.role,
            dbName,
            companyName: user.companyName,
            companyDisplayName: user.companyDisplayName,
            isDemo: true,
        }
    } catch (err) {
        // A half-built demo is worse than none: leave nothing behind.
        try {
            await destroyDemo(dbName)
        } catch {
            // The original failure is the one worth reporting.
        }
        throw err
    }
}
