require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { response } = require('./controller/responseHandler')
require('./config/database/dbconnect')
const { dbConfigure } = require('./config/database/dbconnect')
const fs = require('fs')
const path = require('path')

const packageJson = path.join('package.json')
const json = JSON.parse(fs.readFileSync(packageJson, 'utf-8'))
// console.log(process)
const app = express()

// morgan only logs requests in development
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

// makes it easy to dynamically configure the db
// just create a CLUSTER on atlas cloud,
// pick the URL and add... voila!, you're connected to the DB!
dbConfigure(process.env.DB_CONNECT)

app.listen(process.env.PORT || 4000, () => console.log(`app is running`))
