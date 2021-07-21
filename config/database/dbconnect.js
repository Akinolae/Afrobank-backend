const mongoose = require('mongoose')

const dbConfigure = async (uri) => {
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

module.exports = { dbConfigure }
