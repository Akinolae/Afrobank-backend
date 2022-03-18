const customer = require('../../controller/userManagement')

module.exports = {
  deleteNotification: (req, res) => {
    const { accountNumber, index } = req.body
    customer.deleteNotification(accountNumber, index, res)
  },
  fetchAllNotifications: (req, res) => {
    const { id } = req.params
    customer.getNotifications(id, res)
  },
}
