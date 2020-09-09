// const db = require("../../config/database/dbconnect");
const { sequelize } = require("../../config/database/dbconnect");
const { customer } = require("../../model/customer");
const nodemailer = require("nodemailer");
const otpGenerator = require('otp-generator');
const otp = otpGenerator.generate(6, {alphabets: false, digits: true, specialChars: false, upperCase:false})

module.exports = {
  transfer: (req, res) => {
    const { sender, recipient, amount, pin } = req.body;
    // Queries the database, checks if the sender exists in the data bases
    sequelize.sync().then(() => {
      customer
        .findOne({
          raw: true,
          where: {
            accountNumber: sender,
          },
        })
        .then((Sender) => {
          if (!Sender) {
            res.status(404).json({
              success: false,
              message: "Enter a valid account number.",
            });
          }
          if (pin !== Sender.pin) {
            res.status(401).json({
              status: false,
              message: "Invalid pin.",
            });
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
                  res.status(404).json({
                    success: false,
                    message: "Recipient account number is invalid.",
                  });
                } else {
                  if (isNaN(amount)) {
                    res.status(401).json({
                      status: false,
                      message: "enter a valid amount",
                    });
                  } else {
                    //  converts each account balance to integers
                    //  the data that is returned is not a number/integer but a string of numbers
                    //  account balance of the sender and the reciever.
                    const senderBalance = parseInt(Sender.accountBalance);
                    const reciverBalance = parseInt(Recipient.accountBalance);

                    //  checks if the sender  has  enough balance to proceed with the transaction
                    if (senderBalance <= 0) {
                      res.status(401).json({
                        status: false,
                        message: "your account balance is low",
                      });
                    } else if (amount <= 0) {
                      res.status(401).json({
                        success: false,
                        message: "Enter a valid amount.",
                      });
                    } else if (amount > senderBalance) {
                      res.status(401).json({
                        success: false,
                        message: "Insufficient balance.",
                      });
                    } else {
                        console.log(otp, 'otp')

                      // send user an sms

                    // sender
                      //  The sender's message.
                      customer
                        .update(
                          {
                            accountBalance: senderNewBalance,
                          },
                          {
                            where: {
                              accountNumber: Sender.accountNumber,
                            },
                          }
                        )
                        .then(() => {
                          customer
                            .update(
                              {
                                accountBalance: recievedTransfer,
                              },
                              {
                                where: {
                                  accountNumber: Recipient.accountNumber,
                                },
                              }
                            )
                            .then(() => {
                              // Send both parties notification upon transaction completion

                              // sender notification
                              async function main() {
                                // create reusable transporter object using the default SMTP transport
                                let transporter = nodemailer.createTransport({
                                  host: "smtp.gmail.com",
                                  port: 587,
                                  secure: false, // true for 465, false for other ports
                                  auth: {
                                    user: process.env.EMAIL, // Specific gmail account which can be found in the confi
                                    pass: process.env.EMAIL_PASSWORD, // Specific gmail account which can be found in the co
                                  },
                                  tls: {
                                    rejectUnauthorized: false,
                                  },
                                });

                                let info = await transporter.sendMail({
                                  from: `Afrobank ${process.env.EMAIL}`, // sender address
                                  to: Sender.email, //reciever address that was gotten from the frontend/client
                                  subject: `AeNS Transaction Alert [Debit:${amount}.00]`,
                                  text: `A debit transaction occured  on your account with us`,
                                  html: senderMsg,
                                });
                                console.log("Message sent: %s", info.messageId);
                                console.log(
                                  "Preview URL: %s",
                                  nodemailer.getTestMessageUrl(info)
                                );
                              }
                              main().catch(console.error);
                              // This is for the recipient
                              async function main2() {
                                let transporter = nodemailer.createTransport({
                                  host: "smtp.gmail.com",
                                  port: 587,
                                  secure: false, // true for 465, false for other ports
                                  auth: {
                                    user: process.env.EMAIL, // Specific gmail account which can be found in the confi
                                    pass: process.env.EMAIL_PASSWORD, // Specific gmail account which can be found in the co
                                  },
                                  tls: {
                                    rejectUnauthorized: false,
                                  },
                                });
                                // send mail with defined transport object
                                let info = await transporter.sendMail({
                                  from: `Afrobank ${process.env.EMAIL}`, // sender address
                                  to: Recipient.email, //reciever address that was gotten from the frontend/client
                                  subject: `AeNS Transaction Alert [Credit:${amount}.00]`,
                                  text: `A Credit transaction occured  on your account with us`,
                                  html: recipientMsg,
                                });
                                console.log("Message sent: %s", info.messageId);
                                console.log(
                                  "Preview URL: %s",
                                  nodemailer.getTestMessageUrl(info)
                                );
                              }
                              main2().catch(console.error);

                              res.status(200).json({
                                success: true,
                                message: message.toUpperCase(),
                              });
                            })
                            .catch((err) => {
                              res.status(400).json({
                                success: false,
                                message: "Unable to complete transaction",
                              });
                            });
                        });
                    }
                  }
                }
              });
          }
        });
    });
  },
};
