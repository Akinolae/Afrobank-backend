const db = require("../../config/database/dbconnect");

module.exports = {
    localLogin: (req, res) => {
        const { accountnumber, firstname } = req.body;
         db.query(
             "SELECT * FROM customers Where accountnumber = ?",
             [accountnumber],
             (err, data) => {
                 if (err) {
                     throw err;
                 } else {
                     if (err) {
                         res.json({
                             message: `invalid user`,
                         });
                     }
                     const user = data[0].firstname;
                     if (firstname !== user) {
                         res.json({
                             status: false,
                             message: "invalid login parameters",
                         });
                     } else {
                         res.json({
                             status: true,
                             message: "login successful",
                         });
                     }
                 }
             }
         );
    }
}