const db = require("../../config/database/dbconnect");

module.exports = {
    pinReset: (req, res)=> {
            const { pin, confirmPin } = req.body

            res.json({
                status: true,
                message: pin
            })
    }
}