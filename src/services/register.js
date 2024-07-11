'use strict'
require('dotenv').config()
const { user } = require('../controller/userManagement')

module.exports = {
  register: (req, res) => {
    console.log({ req })
    user.register(req.body, res)
  },
  confirmSignUp: (req, res) => {
    const { email, code } = req.body
    user.confirmSignUp(email, code, res)
  },
}
