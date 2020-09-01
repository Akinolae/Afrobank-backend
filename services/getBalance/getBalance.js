const db = require("../../config/database/dbconnect");

module.exports = {
    getAccountBalance: (req, res) => {
         const { id } = req.params;

         db.query(
             "SELECT accountBalance FROM customers where accountNumber = ? ",
             id,
             (err, data) => {
                 if (err) {
                     res.status(400).json({
                         status: false,
                         message: err,
                     });
                 }if(!data){
                     res.status(400).json({
                         status: false,
                         message: "User doesn't exist."
                     })
                 }
                  else {
                     res.status(200).json({
                         status: true,
                         message: data,
                     });
                 }
             }
         );
    }
}