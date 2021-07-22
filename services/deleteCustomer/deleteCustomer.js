const customer = require('../../controller/userManagement')

module.exports = {
    deleteCustomer: (req, res) => {
        const { id } = req.params
        customer.deleteCustomer(id, res)
    },
}
