require("dotenv").config();
const {
    response
} = require('./responseHandler');
const nodemailer = require("nodemailer");
const redisClient = require("../lib/redis");
const jwt = require("jsonwebtoken");
const otpGenerator = require('otp-generator')
const statusCode = require('http-status-codes');
const messages = require("./data");

redisClient.on("error", function (error) {
    console.error(error);
});
// Secures connection.
redisClient.on("connect", () => {
    console.log("Cache connection established");
});


module.exports = class Customer {
    constructor(_sequelize, _customer) {
        this.sequelize = _sequelize
        this.customer = _customer
    }
    // #1
    register(firstname, lastname, surname, email, phonenumber, gender, res) {
        // CREATES VIRTUAL ACCOUNT NUMBERS AND DEFAULT PINS
        const accountNumber = Math.floor(Math.random() * 10000000000);
        const accountBalance = process.env.DEFAULT_BALANCE;
        const pin = process.env.DEFAULT_PIN

        const user = {
            firstname,
            surname,
            lastname,
            email,
            phonenumber,
            gender,
            accountNumber,
            accountBalance,
            pin
        };
        if(!firstname || !lastname || !surname || !email || !phonenumber || !gender){
            var msg = "all fields are required"
            response(msg, false, statusCode.StatusCodes.UNAUTHORIZED, res)
        }
        this.sequelize.sync().then(() => {
            this.customer
                .create(user)
                .then(() => {
                    const newUser = `${surname}  ${firstname}   ${lastname}`;
                    // message to be sent to the newly registered user!
                    messages.sign_up_message( newUser, pin, accountBalance, accountNumber );
                    const subject = "Account opening ";
                    const text = "Welcome to Afrobank";
                    const respMsg = "Customer registered successfully"
                    this.sendMail(messages.sign_up_message( newUser, pin, accountBalance, accountNumber ), email, subject, text);
                    response(respMsg, true, statusCode.StatusCodes.OK, res)
                })
                .catch((err) => {
                    const respMsg = "Email already exists."
                    response(respMsg, false, statusCode.StatusCodes.FORBIDDEN, res);
                });
        });
    }

    // #2
    // returns the account balance of the specified user.
    getBalance(id, res) {
        this.customer.findOne({
            raw: true,
            where: {
                accountNumber: id
            }
        }).then((resp) => {
            const respMsg = "Invalid user."
            const data = resp.accountBalance
            redisClient.setex(id, 3600, data);
            !resp ? response(respMsg, false, statusCode.StatusCodes.NOT_FOUND, res) :
                redisClient.get(id, (err, resp) => {
                    err ? response(err, false, statusCode.StatusCodes.UNAUTHORIZED, res) : response(resp, true, 200, res)
                })

        }).catch((err) => {
            const respMsg = "An error occured."
            response(respMsg, false, statusCode.StatusCodes.SERVICE_UNAVAILABLE, res);
        })
    }

    // #3
    // returns all users in the scope
    getUsers(res) {
        this.customer.findAll({
                raw: true
            })
            .then((resp) => {
                const respMsg = "No customer to display";
                resp.length === 0 ? response(respMsg, false, 404, res) : response(resp, true, 200, res)
            })
            .catch((err) => {
                response(err, false, 400, res);
            })
    }

    // #4
    login(accountNumber, firstName, res) {
        const msg = "Account number and firstname is required";
        !accountNumber || !firstName ? response(msg, false, 400, res) :
            this.customer.findOne({
                raw: true,
                where: {
                    accountNumber: accountNumber
                }
            }).then((resp) => {
                const date = new Date();
                const hours = date.getHours()
                const minutes = date.getMinutes()
                const customerCareLine = '08183430438';
                const text = "Login notification"
                const subject = "Account Login"
                const sucessMsg = "Login successfully";
                const resMsg = "Invalid login parameters"
                firstName !== resp.firstname ? response(resMsg, false, 401, res) :
                    response(sucessMsg, true, 200, res, null, resp)
                    this.sendMail(messages.login_notify(resp, hours, minutes, customerCareLine), resp.email, subject, text);
            }).catch((err) => {
                const resMsg = err;
                if(!err){
                    throw response(resMsg, false, 401, res);
                }
                return null;
            })
    }
    // #5
     getUser = (accountNumber, res) => {
        this.customer.findOne({
            raw: true,
            where: {
                accountNumber: accountNumber
            },
        }).then((resp) => {
            const resMsg = "invalid account details.";
                const user = `${resp.firstname} ${resp.lastname} ${resp.surname}`;
                console.log(resp);
                resp.length === 0 ? response(resMsg, false, 404, res) : response(user.toUpperCase(), true, 200, res);
        }).catch((err) => {
            console.log(err)
            const resMsg = "account not recognised.";
            response(resMsg, false, 400, res);
        })
    }

    // #6
    setPin(accountNumber, pin, res) {
        const resMsg = "Pin must be numbers.";
        const pinLength = "Pin must be 4 digits."
        isNaN(pin) ? response(resMsg, false, 401, res) : null;
        pin.length !== 4 ? response(pinLength, false, 401, res) :
            this.customer.update({
                pin: pin
            }, {
                where: {
                    accountNumber: accountNumber
                }
            }).then((data) => {
                const resMsg = "Invalid user";
                const message = "Pin updated successfully."
                data[0] === 0 ? response(resMsg, false, 401, res) : response(message, true, 200, res)
            }).catch(() => {
                const message = "Unable to update pin";
                response(message, false, 400, res);
            })
    }

    // #7
    completeTransfer(res, sender, recipient, amount, otp) {
        const message = "All fields are required.";
        const msg = "enter a valid amount";
        !otp || !sender || !recipient || !amount ? response(message, false, 400, res) : null
        isNaN(amount) ? response(msg, false, 401, res) :
            this.customer.findAll({
                raw: true,
                where: {
                    accountNumber: sender
                }
            }).then((user) => {
                const message = "Unable to complete transaction. Check credentials";
                const otpError = "Transaction error.";
                user.length === 0 ? response(message, false, 400, res) : null;
                otp !== user[0].otp ? response(otpError, false, 401, res) :
                    this.customer.findOne({
                        raw: true,
                        where: {
                            accountNumber: recipient
                        }
                    }).then((newRecipient) => {
                        const message = "Check credentials.";
                        !newRecipient ? response(message, false, 401, res) : null;

                        const date = new Date();
                        const reciverBalance = parseInt(newRecipient.accountBalance);
                        const senderBalance = parseInt(user[0].accountBalance);
                        const hours = date.getHours();
                        const minutes = date.getMinutes();
                        const transactionAmt = parseInt(amount);
                        const senderNewBalance = senderBalance - transactionAmt;
                        const recievedTransfer = transactionAmt + reciverBalance;
                        const SenderSms = `
                    Acct: ${sender}
                    Amt: ${amount}
                    Desc: Transfer to ${recipient}
                    Avail: ${senderNewBalance};
                    `;
                        const reciSms = `
                    Acct: ${recipient}
                    Amt: ${amount}
                    Desc: Transfer to ${recipient}
                    Avail: ${senderNewBalance};
                    `;
                        this.customer.update({
                            accountBalance: senderNewBalance,
                            otp: null
                        }, {
                            where: {
                                accountNumber: user[0].accountNumber,
                            },
                        }).then(() => {
                            this.customer
                                .update({
                                    accountBalance: recievedTransfer,
                                }, {
                                    where: {
                                        accountNumber: newRecipient.accountNumber,
                                    },
                                })
                                .then(() => {
                                    const text = "Transaction notification";
                                    const senderSubj = `AeNS Transaction Alert [DEBIT:${amount}.00]`;
                                    const reciverSubj = `AeNS Transaction Alert [CREDIT:${amount}.00]`
                                    // Send both parties notification upon transaction completion
                                    const {
                                        sendText,
                                        sendMail
                                    } = this;
                                    sendMail( messages.sender_transaction_completed_notify(user, transactionAmt, hours, minutes, senderNewBalance, newRecipient), user[0].email, senderSubj, text);
                                    sendMail( messages.recipient_transaction_completed_notify(newRecipient, transactionAmt, hours, minutes, user, recievedTransfer), newRecipient.email, reciverSubj, text);

                                    const resMsg = `TRANSACTION COMPLETED SUCCESSFULLY.`;
                                    response(resMsg, true, 200, res);
                                }).catch(() => {
                                    const resMsg = "Unable to complete transaction";
                                    response(resMsg, false, 400, res);
                                });
                        })
                    })
            })
    }

    // #8
    updateOtp(accountNumber) {
        setTimeout(() => {
            this.sequelize.sync().then(() => {
                this.customer.update({
                    otp: null,
                }, {
                    where: {
                        accountNumber: accountNumber
                    }
                })
            })
        }, 900000);
    }
    // #9
    // sendText(phonenumber, message) {
        // client.messages
            // .create({
                // from: "+15017122661",
                // body: message,
                // to: phonenumber,
            // })
            // .then((message) => console.log(message.sid));
    // }
    // #10
    sendMail(message, recipient, subject, text) {
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
                to: recipient, //reciever address that was gotten from the frontend/client
                subject: subject,
                text: text,
                html: message,
            });
            // console.log("completed");
            console.log("Message sent: %s", info.messageId);
            console.log(
                "Preview URL: %s",
                nodemailer.getTestMessageUrl(info)
            );
        }
        main();
    }
    // #11
    updateTransactionHistory(type, acctNo, transactionHistory) {
        this.sequelize.sync().then(() => {
            transactionHistory.update({
                transactionType: type,
                accountNumber: 1234
            }, {
                where: {
                    accountNumber: acctNo
                }
            }).then(() => {
                console.log("success")
            }).catch((err) => {
                console.log(err);
            })
        })
    }

    // #12
    deleteCustomer(accountNo, res) {
        this.sequelize.sync().then(() => {
            this.customer.destroy({
                raw: true,
                where: {
                    accountNumber: accountNo
                }
            }).then((resp) => {
                const msg = "Customer doesn't exist.";
                const confMsg = "Customer deleted";
                resp === 0 ? response(msg, false, 400, res) : response(confMsg, true, 200, res);
            }).catch(() => {
                const msg = "Unable to delete customer."
                response(msg, false, 400, res);
            })
        })
    }

    // #13
    sendOtp (sender) {
        const otp = otpGenerator.generate(6, {
            alphabets: false,
            digits: true,
            specialChars: false,
            upperCase: false
          })
        const message = `Afrobank otp <strong>${otp}</strong>`
        const subject = `AeNS Transaction OTP`;
        const text = `OTP`
        this.sendMail(message, sender.email, subject, text);
          customer.update({
            otp: otp
          }, {
            where: {
              accountNumber: sender
            }
          })
    }

}