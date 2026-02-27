import { MongoClient } from 'mongodb'
import { config } from '../config/index.js'
import { logger } from './logger.service.js'

const MASTER_DB = 'barapp_master'

export const dbService = { getCollection, getMasterCollection, close }

var dbClient = null

async function getClient() {
    if (dbClient) return dbClient
    try {
        const client = await MongoClient.connect(config.dbURL)
        dbClient = client
        logger.info('Successfully Connected to MongoDB')
        return dbClient
    } catch (err) {
        logger.error('Cannot Connect to DB', err)
        throw err
    }
}

async function getCollection(collectionName, dbName) {
    try {
        const client = await getClient()
        return client.db(dbName).collection(collectionName)
    } catch (err) {
        logger.error('Failed to get Mongo collection', err)
        throw err
    }
}

async function getMasterCollection(collectionName) {
    return getCollection(collectionName, MASTER_DB)
}

async function close() {
    if (dbClient) {
        await dbClient.close()
        dbClient = null
    }
}
