export const dbConfig = {
    uri: process.env.DB_URL || 'mongodb+srv://edenavgi:Eden1241@cluster0.c0xgvi6.mongodb.net/?retryWrites=true&w=majority',
    dbName: process.env.DB_NAME || 'bandit_db',
    options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }
}
