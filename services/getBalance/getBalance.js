const {sequelize} = require("../../config/database/dbconnect");
const {customer} = require("../../model/customer");

module.exports = {
    getAccountBalance: (req, res) => {
         const { id } = req.params;
        sequelize.sync().then(() => {
            customer.findOne({
                raw: true,
                where: {
                    accountNumber: id
                }
            }).then((resp) => {
                if(!resp){
                    res.status(404).json({
                        success: false,
                        message: "Invalid account number"
                    })
                }else{
                    res.status(200).json({
                        success: true,
                        message: resp.accountBalance
                    })
                }
            }).catch((err) => {
                res.status(400).json({
                    success: false,
                    message: err
                })
            })
        })
    }
}