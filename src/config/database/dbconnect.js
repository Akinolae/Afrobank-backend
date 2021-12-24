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

const appConfig = (config, params) => {
    // extract the specific config type
    const { type } = config
    if (!type || !params)
        throw new Error('configuration needs a type and a parameter')
    else if (typeof type !== 'string')
        throw new Error('app type must be a string')
    else {
        // Runs configuration based on the config type specified
        // makes it easier to add other configurations, dynamically
        type === 'db' && dbConfig(params)
    }
}

module.exports = { appConfig }
