const db = require("../../config/database/dbconnect");

module.exports = {
    getTransactionHistory: (req, res) => {
        const { id } = req.params
        db.query(`select * from transactions where id = ${id}`, (err, data) => {
            if(err){
                res.json({
                    status: false,
                    message: err.sqlMessage
                })
            }else {
                res.json({
                    status: true,
                    message: data
                })
            }
        })
    }
}