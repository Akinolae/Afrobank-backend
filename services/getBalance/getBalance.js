const db = require("../../config/database/dbconnect");

module.exports = {
    getAccountBalance: (req, res) => {
         const { id } = req.params;

         db.query(
             "SELECT accountBalance FROM customers where accountNumber = ? ",
             id,
             (err, data) => {
                 if (err) {
                     res.json({
                         status: false,
                         message: err,
                     });
                 } else {
                     res.json({
                         status: true,
                         message: data,
                     });
                 }
             }
         );
    }
}