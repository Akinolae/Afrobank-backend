require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { response } = require('./controller/responseHandler')
require('./config/database/dbconnect')
const { dbConfigure } = require('./config/database/dbconnect')

const app = express()
if (process.env.NODE_ENV === 'development') {
    const morgan = require('morgan')
    app.use(morgan('combined'))
}

app.use(cors())
app.use(express.json())
app.use('/Api/v1', require('./routes/index'))

app.use((req, res) => {
    const msg = 'page not found'
    response(msg, 'error', 400, res)
})

dbConfigure(process.env.DB_CONNECT)
app.listen(process.env.PORT || 4000, () => console.log(`app is running`))
