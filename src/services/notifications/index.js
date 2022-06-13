const { user } = require('../../controller/userManagement')

module.exports = {
  deleteNotification: (req, res) => {
    const { accountNumber, index } = req.body
    user.deleteNotification(accountNumber, index, res)
  },
  fetchAllNotifications: (req, res) => {
    const { id } = req.params
    user.getNotifications(id, res)
  },
}
