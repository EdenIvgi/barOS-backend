export default {
    // Production should always set `DB_URL` (or MONGO_URL) in env
    dbURL: process.env.DB_URL || process.env.MONGO_URL || 'mongodb+srv://edenavgi:Eden1241@cluster0.c0xgvi6.mongodb.net/?appName=Cluster0',
    dbName: process.env.DB_NAME || 'bandit_db'
}
