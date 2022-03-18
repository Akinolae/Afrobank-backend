require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { response } = require('./controller/responseHandler')
const { appConfig } = require('./config')
const app = express()

const URI =
  process.env.NODE_ENV === 'development'
    ? process.env.DB_CONNECT
    : process.env.DB_CONNECT_PROD

appConfig({ type: 'db' }, URI)
// morgan only logs requests in development \\
if (process.env.NODE_ENV === 'development') {
  const morgan = require('morgan')
  app.use(morgan('combined'))
}

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
  console.log(`app is running ${process.env.PORT}`)
})
