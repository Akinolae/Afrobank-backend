'use strict'
require('dotenv').config()
const { user } = require('../../controller/userManagement')

module.exports = {
  register: (req, res) => {
    user.register(req.body, res)
  },
}
