const customer = require('../../controller/userManagement')

module.exports = {
    deleteNotification: (req, res) => {
        const { index } = req.params
        customer.deleteNotification(index)
    },
    fetchAllNotifications: (req, res) => {
        const { id } = req.params
        customer.getNotifications(id, res)
    },
}
