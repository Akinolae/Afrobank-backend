const customer = require("../../model/customer");
const otpGenerator = require('otp-generator');
const Customer = require("../../controller/index");
const {response} = require("../../controller/responseHandler");
const newCustomer = new Customer( customer );


module.exports = {
  transfer: (req, res) => {
    const {
      sender,
      recipient,
      amount,
      pin
    } = req.body;
    // Queries the database, checks if the sender exists in the data bases
      customer
        .findOne({
          raw: true,
          where: {
            accountNumber: sender,
          },
        })
        .then((Sender) => {
          if (!Sender) {
            const msg = "Enter a valid account number."
            response(msg, false, 400, res);
          }
          if (pin !== Sender.pin) {
            const msg = "Invalid pin.";
            response(msg, false, 401, res);
          } else {
            customer
              .findOne({
                raw: true,
                where: {
                  accountNumber: recipient,
                },
              })
              .then((Recipient) => {
                if (!Recipient) {
                  const msg = "Recipient account number is invalid.";
                  response(msg, false, 404, res);
                } else {
                  if (isNaN(amount)) {
                    const msg = "enter a valid amount";
                    response(msg, false, 401, res);
                  } else {
                    const senderBalance = parseInt(Sender.accountBalance);
                    if (senderBalance <= 0) {
                      const msg = "your account balance is low";
                      response(msg, false, 401, res);
                    } else if (amount <= 0) {
                      const msg = "Enter a valid amount.";
                      response(msg, false, 401, res);
                    } else if (amount > senderBalance) {
                      const msg = "Insufficient balance.";
                      response(msg, false, 401, res);
                    } else {
                      newCustomer.sendOtp(Sender);
                      const msg = "OTP sent to your email. It expires 15 minutes.";
                      response(msg, true, 200, res);
                    }
                  }
                }
              });
          }
        });
    newCustomer.updateOtp(sender);
  },
  completeTransfer: (req, res) => {
    const {
      otp,
      sender,
      recipient,
      amount
    } = req.body;
    const newCustomer = new Customer(sequelize, customer)
    newCustomer.completeTransfer(res, sender, recipient, amount, otp);
  }
};