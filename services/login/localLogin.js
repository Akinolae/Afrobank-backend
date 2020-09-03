    const {
        customer
    } = require("../../model/customer");

    module.exports = {
        localLogin: async (req, res) => {
            const {
                accountnumber,
                firstname
            } = req.body;
            if (!accountnumber) {
                res.status(400).json({
                    success: false,
                    message: "Account number is required"
                })
            } else {
               await customer.findOne({
                    raw: true
                }, {
                    where: {
                        accountNumber: accountnumber
                    }
                }).then((resp) => {
                    if(firstname !== resp.firstname){
                        res.status(401).json({
                            success: false,
                            message: "Invalid login parameters"
                        })
                    }else {
                        res.status(200).json({
                            success: true,
                            message: "Login successfully",
                            data: resp
                        })
                    }
                }).catch((err) => {
                    res.status(401).json({
                        success: false,
                        message: "Unable to login"
                    })
                })

            }
        }
    }