const customer = require('../../controller/userManagement')

module.exports = {
  getUser: (req, res) => {
    customer.getUser(req, res)
  },
  getAllUsers: (req, res) => {
    customer.getUsers(req, res)
  },
}
