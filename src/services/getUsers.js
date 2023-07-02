const { user } = require('../controller/userManagement')
const { userTransactions } = require('../controller/transactions')

module.exports = {
  getUser: (req, res) => user.getUser(req, res),
  getAllUsers: (req, res) => user.getUsers(req, res),
  getProfile: (req, res) => user.getProfile(req, res),
  verifyToken: (req, res) => user.verifyToken(req, res),
  getNewToken: (req, res) => user.getNewToken(req, res),
  getFriendsList: (req, res) => user.getFriendList(req, res),
  addAfriend: (req, res) => user.addFriend(req, res),
  getFriendAccount: (req, res) => userTransactions.getFriendAccount(req, res),
}
