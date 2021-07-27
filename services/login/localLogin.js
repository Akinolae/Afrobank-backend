require('dotenv').config()
const user = require('../../controller/userManagement')
module.exports = {
    localLogin: (req, res) => {
        const { email, password } = req.body
        user.login(email, password, res)
    },
}
