const {
    customer
} = require("../../model/customer");
const {
    sequelize
} = require("../../config/database/dbconnect");


module.exports = {
    getUsers: (req, res) => {
        sequelize.sync().then(async () => {
            await customer.findAll({
                    raw: true
                })
                .then((resp) => {
                    if (resp.length === 0) {
                        res.status(404).json({
                            success: false,
                            message: "No users to display"
                        })
                    } else {
                        res.status(200).json({
                            success: true,
                            message: resp
                        })
                    }
                })
                .catch((err) => {
                    res.status(404).json({
                        success: false,
                        message: err
                    })
                })
        });
    },
    getUser: (req, res) => {
        const {
            accountNumber
        } = req.body;
        sequelize.sync().then(async () => {
            await customer.findAll({
                raw: true,
                where: {
                    accountNumber: accountNumber
                }
            }).then((resp) => {
                if (resp.length === 0) {
                    res.status(404).json({
                        success: false,
                        message: "invalid account details."
                    })
                } else {
                    res.status(200).json({
                        success: true,
                        message: resp
                    })
                }
            }).catch((err) => {
                res.status(404).json({
                    success: false,
                    message: err
                })
            })
        })
    },
    deleteUser: (req, res) => {

    }
}