import { setupModel } from './setup.model.js'

export const setupService = {
    getState,
    saveState,
}

async function getState(dbName) {
    return setupModel.get(dbName)
}

async function saveState(patch, dbName) {
    return setupModel.save(patch, dbName)
}
