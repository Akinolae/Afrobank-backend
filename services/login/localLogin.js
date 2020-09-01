const db = require("../../config/database/dbconnect");

module.exports = {
    localLogin:  (req, res) => {
        const { accountnumber, firstname } = req.body;
         db.query(
             `SELECT * FROM customers Where accountnumber = ${accountnumber}`,
             (err, data) => {
                    if(err) {
                        res.status(401).json({
                            message: err
                        })
                    }
                  if (data.length === 0) {
                         res.status(401).json({
                             message: `invalid user`,
                         });
                     }
                     else{
                     const user = data[0].firstname;
                     if (firstname !== user) {
                         res.status(401).json({
                             status: false,
                             message: "invalid login parameters",
                         });
                     } else {
                         res.status(200).json({
                             status: true,
                             message: "login successful",
                         });
                     }
                    }
                 }
         );
    }
}