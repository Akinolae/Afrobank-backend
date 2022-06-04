const customer = require('../../controller/userManagement')

module.exports = {
  getUser: (req, res) => {
    const { id } = req.params
    customer.getUser(id, res, req)
  },
  getAllUsers: (req, res) => {
    customer.getUsers(req, res)
  },
}
