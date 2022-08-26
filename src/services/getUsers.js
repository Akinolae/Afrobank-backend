const { user } = require('../controller/userManagement')

module.exports = {
  getUser: (req, res) => {
    user.getUser(req, res)
  },
  getAllUsers: (req, res) => {
    user.getUsers(req, res)
  },
  getProfile: (req, res) => {
    user.getProfile(req, res)
  },
}
