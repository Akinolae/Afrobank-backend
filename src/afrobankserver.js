require('dotenv').config()
const { response } = require('./controller/responseHandler')
const cors = require('cors')
const express = require('express')
const { appConfig } = require('./lib/db')

// morgan only logs requests in development \\
const app = express()

if (process.env.NODE_ENV === 'development') {
  const morgan = require('morgan')
  app.use(morgan('combined'))
}

// app.use()
app.use(cors())
app.use(express.json())
app.use('/Api/v1', require('./routes/index'))

app.use((req, res) => {
  const msg = 'page not found'
  response(msg, 'error', 404, res)
})

app.listen(process.env.PORT || 4000, () => {
  // makes it easy to dynamically configure the db \\
  // just create a CLUSTER on atlas cloud, \\
  // pick the URL and add... voila!, you're connected to the DB! \\
  appConfig({ type: 'db' })
  console.log(`app is running ${process.env.PORT}`)
})

module.exports = { app }
