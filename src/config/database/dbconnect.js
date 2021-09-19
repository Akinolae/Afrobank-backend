const mongoose = require('mongoose')

const dbConfig = async (uri) => {
    try {
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true,
        })
        console.log('=== DB connection established ===')
        return true
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = { dbConfig }
