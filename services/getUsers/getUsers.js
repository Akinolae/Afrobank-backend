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
deleteUser: (req, res) => {
        
    }
}