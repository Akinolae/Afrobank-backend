const user = require('../../controller/userManagement/index')

module.exports = {
    changePassword: (req, res) => {
        const { user, password } = req.body
        user.changePassword(user, password, res)
    },
}
