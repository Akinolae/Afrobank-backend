const db = require("../../config/database/dbconnect");
module.exports = {
    getUsers: (req, res) => {
        db.query("select * from customers", (err, data) => {
            if (err) {
                res.sendStatus(404);
            } else {
                // const newData = JWT.sign(data[0], "Afrobank");
                res.json({
                    data: data,
                });
            }
        });
    },
    getUser: (req, res) => {
            const { accountNumber } = req.body;
            db.query("SELECT * from customers where accountNumber = ? ", [accountNumber], (err, resp) => {
                if(err) throw err; 
                if(resp.length === 0){
                    res.json({
                        status: false,
                        message: "Invalid account number"
                    })
                }
                else {
                    res.json({
                        status: true,
                        message: resp
                    })
                }
            })
    },
deleteUser: (req, res) => {
        
    }
}