'use strict'
require('dotenv').config()
const user = require('../../controller/userManagement')

module.exports = {
    register: (req, res) => {
        const { firstName, lastName, email, phoneNumber, gender, password } =
            req.body
        user.register(
            firstName,
            lastName,
            email,
            phoneNumber,
            gender,
            password,
            res
        )
    },
}
