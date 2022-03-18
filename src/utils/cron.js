const scheduler = require('node-schedule')

const job = ({ date, method }) => {
  scheduler.scheduleJob(date, method)
}

module.exports = job
