'use strict'
require('dotenv').config()
const customer = require('../../controller/index')

module.exports = {
    register: (req, res) => {
        const { firstName, lastName, surName, email, phoneNumber, gender } =
            req.body
        customer.register(
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
