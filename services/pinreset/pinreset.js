const {
    sequelize
} = require("../../config/database/dbconnect");
const {
    customer
} = require("../../model/customer");

module.exports = {
    pinReset: (req, res) => {
        const {
            accountNumber,
            pin
        } = req.body;
        if (isNaN(pin)) {
            res.status(401).json({
                success: false,
                message: "Pin must be numbers."
            })
        }
        if (pin.length !== 4) {
            res.status(401).json({
                success: false,
                message: "Pin must be 4 digits."
            })
        }
        sequelize.sync().then(() => {
            customer.update({
                pin: pin
            }, {
                where: {
                    accountNumber: accountNumber
                }
            }).then((data) => {
                if (data[0] === 0) {
                    res.status(401).json({
                        success: false,
                        message: "Invalid user"
                    })
                } else {
                    res.status(200).json({
                        success: true,
                        message: "Pin updated successfully."

                    })
                }
            }).catch((err) => {
                res.status(401).json({
                    success: false,
                    message: "Unable to update pin"
                })
            })
        })
    }
}