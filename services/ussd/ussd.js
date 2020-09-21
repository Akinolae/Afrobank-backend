const { sequelize} = require("../../config/database/dbconnect");
const {customer} = require("../../model/customer");
const Customer = require("../../controller/index");

module.exports = {
    ussdTransaction: (req, res) => {
        const {sessionId, serviceCode, phoneNumber, text} = req.body;
        console.log("Afrobank", req.body)
    }
}