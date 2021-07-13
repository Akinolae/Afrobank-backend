'use strict'
require('dotenv').config()
const user = require('../../controller/userManagement')

module.exports = {
    register: (req, res) => {
        const { firstName, lastName, surName, email, phoneNumber, gender } =
            req.body
        user.register(
            firstName,
            lastName,
            surName,
            email,
            phoneNumber,
            gender,
            res
        )
    },
}
