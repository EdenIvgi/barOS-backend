import { logger } from './logger.service.js'

/**
 * Provision a new bar database.
 * No-op — MongoDB auto-creates collections on first insert.
 * @param {string} dbName — fully resolved database name (e.g. "bandit_db")
 */
export async function provisionUserDb(dbName) {
    logger.info(`Database "${dbName}" ready (collections created on first use)`)
}
