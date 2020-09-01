const db = require("../../config/database/dbconnect");
module.exports = {
    getUsers: (req, res) => {
        db.query("select * from customers", (err, data) => {
            if (err) {
                res.status(404).json({
                    message: "Error"
                });
            }if(!data){
                res.status(401).json({
                    message: "User doesn't exist!"
                })
            }
             else {
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
                    res.status(400).json({
                        status: false,
                        message: "Invalid account number"
                    })
                }
                else {
                    res.status(200).json({
                        status: true,
                        message: resp
                    })
                }
            })
    },
deleteUser: (req, res) => {
        
    }
}