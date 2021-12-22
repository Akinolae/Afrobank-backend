const mongoose = require('mongoose')

const dbConfig = async (uri) => {
    if (typeof uri !== 'string') {
        throw 'Invalid database uri'
    } else {
        try {
            await mongoose.connect(uri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                useFindAndModify: false,
                useCreateIndex: true,
            })
            console.log('=== DB connection established ===')
        } catch (error) {
            console.log(error)
        }
    }
}

const appConfig = (type, params) => {
    if (typeof type !== 'string') throw new Error('App type must be a string')
    else if (!type || !params) {
        throw new Error('config type and params are required')
    } else {
        type === 'db' && dbConfig(params)
    }
}

module.exports = { appConfig }
