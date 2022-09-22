const cron = require('node-cron')

const job = ({ date, method }) => {
  if (typeof method !== 'function')
    throw new Error(`${method} must be a function`)
  cron.schedule(date, method)
}

module.exports = { job }
