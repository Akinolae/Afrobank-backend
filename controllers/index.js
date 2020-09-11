require("dotenv").config();
const client = require("twilio")(process.env.ACC_SID, process.env.AUTH_TOKEN);
const {
    history
} = require("../model/customer");
const nodemailer = require("nodemailer");

module.exports = class Customer {

    constructor(_sequelize, _customer ) {
        this.sequelize = _sequelize
        this.customer = _customer
    }
    // #1
    register(firstname, lastname, surname, email, phonenumber, gender, res) {
        const accountNumber = Math.floor(Math.random() * 10000000000);
        const accountBalance = 10000;
        const pin = '0000';

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

        this.sequelize.sync().then(() => {
            this.customer
                .create(user)
                .then(() => {
                    const newUser = `${surname}  ${firstname}   ${lastname}`;
                    // message to be sent to the newly registered user!
                    const message = `
         <h2  style="color: white; background-color: #2C6975; padding: 30px; width: 50%;"><strong> Afrobank </strong></h2><br>
         <p> Dear <strong> ${newUser.toUpperCase()}</strong>,</p>
         <p> your <strong>Afrobank</strong> account was created successfully, Thank you for banking with us</p>
         <p>below is your account details </p>
         <p>please note that your account number should not be disclosed to anyone.</p>
         <p> welcome to the <strong>Afrobank</strong> family</p>
         <p>account number: <strong>${accountNumber}</strong></p>
         <p>account name:  <strong> ${newUser.toUpperCase()}</strong></p>
         <p>account balance:<strong> ${accountBalance}</strong></p>
         <p>default pin:<strong> ${pin}</strong></p>

         we urge you to change your transaction pin upon login and keep them confidential.<br>

         Thank you for choosing <strong>Afrobank</strong>.

         `;
                    const subject = "Account opening ";
                    const text = "Welcome to Afrobank";
                    this.sendMail(message, email, subject, text );
                    res.status(200).json({
                        success: true,
                        message: "Customer registered successfully",
                    });
                })
                .catch((err) => {
                    res.status(400).json({
                        success: false,
                        message: "Email already exists.",
                    });
                });
        });
    }


    // #2
    // returns the account balance of the specified user.
    getBalance(id, res) {
        this.sequelize.sync().then(() => {
            this.customer.findOne({
                raw: true,
                where: {
                    accountNumber: id
                }
            }).then((resp) => {
                if (!resp) {
                    res.status(404).json({
                        success: false,
                        message: "Invalid account number"
                    })
                } else {
                    res.status(200).json({
                        success: true,
                        message: resp.accountBalance
                    })
                }
            }).catch((err) => {
                res.status(400).json({
                    success: false,
                    message: err
                })
            })
        })
    }

    // #3
    // returns all users in the scope
    getUsers(res) {
        this.sequelize.sync().
        then(() => {
            this.customer.findAll({
                    raw: true
                })
                .then((resp) => {
                    if (resp.length === 0) {
                        res.status(404).json({
                            success: false,
                            message: "No users to display"
                        })
                    } else {
                        res.status(200).json({
                            success: true,
                            message: resp
                        })
                    }
                })
                .catch((err) => {
                    res.status(404).json({
                        success: false,
                        message: err
                    })
                })
        });
    }

    // #4
    login(accountnumber, firstname, res) {

        var message;
        if (!accountnumber) {
            res.status(400).json({
                success: false,
                message: "Account number is required"
            })
        } else {
            this.customer.findOne({
                raw: true
            }, {
                where: {
                    accountNumber: accountnumber
                }
            }).then((resp) => {
                const date = new Date();
                const hours = date.getHours()
                const minutes = date.getMinutes()
                const customerCareLine = '08183430438';
                message = `
         <h2  style="color: white; background-color: #2C6975; padding: 30px; width: 50%;"><strong> Afrobank </strong></h2><br>
         <p>Dear <strong> ${resp.firstname} ${resp.lastname} ${resp.surname} </strong></p>
         <p>A login attempt was made in your account at <strong>${hours}:${minutes}</strong>.</p>
         <p>If this is you kindly ignore, else, contact us at <strong>${customerCareLine}</strong>.</p><br>

         <p>Thank you for choosing AfroBank.</p>
        
        `;
                const text = "Login notification"
                const subject = "Account Login"
                this.sendMail(message, resp.email, subject, text);
                // send customer a notification.
                if (firstname !== resp.firstname) {
                    res.status(401).json({
                        success: false,
                        message: "Invalid login parameters"
                    })
                } else {
                    res.status(200).json({
                        success: true,
                        message: "Login successfully",
                        data: resp
                    })
                }
            }).catch((err) => {
                res.status(401).json({
                    success: false,
                    message: "Unable to login"
                })
            })
        }
    }
    // #5
    getUser(res, accountNumber) {
        this.sequelize.sync().then(() => {
            this.customer.findOne({
                raw: true,
                where: {
                    accountNumber: accountNumber
                }
            }).then((resp) => {
                if (resp.length === 0) {
                    res.status(404).json({
                        success: false,
                        message: "invalid account details."
                    })
                } else {
                    res.status(200).json({
                        success: true,
                        message: resp
                    })
                }
            }).catch((err) => {
                res.status(400).json({
                    success: false,
                    message: "User not recognised."
                })
            })
        })
    }

    // #6
    setPin(accountNumber, pin, res) {
        if (isNaN(pin)) {
            res.status(401).json({
                success: false,
                message: "Pin must be numbers."
            })
        }
        if (pin.length !== 4) {
            res.status(401).json({
                success: false,
                message: "Pin must be 4 digits."
            })
        }
        this.sequelize.sync()
            .then(() => {
                this.customer.update({
                    pin: pin
                }, {
                    where: {
                        accountNumber: accountNumber
                    }
                }).then((data) => {
                    if (data[0] === 0) {
                        res.status(401).json({
                            success: false,
                            message: "Invalid user"
                        })
                    } else {
                        res.status(200).json({
                            success: true,
                            message: "Pin updated successfully."
                        })
                    }
                }).catch((err) => {
                    res.status(401).json({
                        success: false,
                        message: "Unable to update pin"
                    })
                })
            })
    }

    // #7
    completeTransfer(res, sender, recipient, amount, otp) {
        if (!otp || !sender || !recipient) {
            res.status(401).json({
                success: false,
                message: "All fields are required."
            })
        }
        this.sequelize.sync().then(() => {
                this.customer.findAll({
                    raw: true,
                    where: {
                        accountNumber: sender
                    }
                }).then((user) => {
                    if (user.length === 0) {
                        res.status(400).json({
                            success: false,
                            message: "Unable to complete transaction. Check credentials"
                        })
                    }
                    if (otp !== user[0].otp) {
                        res.status(401).json({
                            success: false,
                            message: "Transaction error."
                        })
                    } else {
                        this.customer.findOne({
                            raw: true,
                            where: {
                                accountNumber: recipient
                            }
                        }).then((newRecipient) => {
                            console.log(newRecipient.accountNumber)
                            if (!newRecipient) {
                                res.status(401).json({
                                    success: false,
                                    message: "Check credentials"
                                })
                            } else {
                                const date = new Date();
                                const reciverBalance = parseInt(newRecipient.accountBalance);
                                const senderBalance = parseInt(user[0].accountBalance);
                                const hours = date.getHours();
                                const minutes = date.getMinutes();
                                const transactionAmt = parseInt(amount);
                                const senderNewBalance = senderBalance - transactionAmt;
                                const recievedTransfer = transactionAmt + reciverBalance;
                                const senderMsg = `
                    <h2  style="color: white; background-color: #2C6975; padding: 30px; width: 50%;"><strong>Afrobank debit alert</strong></h2>
                    <h4>${user.firstname} ${user.lastname} ${user.surname}</h4>
                    <p>We wish to inform you that a debit transaction just occured on your account with us</p>
                    <p style="text-decoration: underline;"><strong>Transaction notification</strong></p>
                    <p>Description: CASH-TRANSFER</p>
                    <p>Amount     :<strong> ${transactionAmt} </strong></p>
                    <p>Time       :<strong> ${hours} : ${minutes}</strong></p>
                    <p>Balance    : <strong>NGN ${senderBalance}</strong></p>
                    <p>Recipient  : <strong>${newRecipient.accountNumber} ${newRecipient.firstname} ${newRecipient.lastname} ${newRecipient.surname}</strong></p>
                    Thank you for banking with <strong> Afrobank </strong>. 
                    `;
                                const recipientMsg = `
                      <h2 style="color: white; background-color: #2C6975; padding: 30px; width: 50%;"><strong>Afrobank Credit alert</strong></h2><br>
                       <h4>Dear ${newRecipient.firstname} ${newRecipient.lastname} ${newRecipient.surname}</h4>
                      <p>We wish to inform you that a credit transaction just occured on your account with us</p>
                      <p style="text-decoration: underline;"><strong>Transaction notification</strong></p>
                     <p>Description : CREDIT</p>
                     <p>Amount      : <strong>${transactionAmt}</strong></p>
                     <p>Time        : <strong>${hours} : ${minutes}</strong></p>
                     <p>Balance     : <strong>NGN ${recievedTransfer}</strong></p>  
                     <p>Sender      : <strong>${user.firstname} ${user.lastname} ${user.surname}</strong></p><br>
                     Thank you for banking with <strong> Afrobank </strong>. 
                     `;
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
                                    otp: ""
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
                                             const {sendText, sendMail} = this;
                                            sendText(user[0].phonenumber, SenderSms)
                                            sendText(newRecipient.phonenumber, reciSms)
                                            sendMail(senderMsg, user[0].email, senderSubj, text);
                                            sendMail(recipientMsg, newRecipient.email, reciverSubj, text);

                                            res.status(200).json({
                                                success: true,
                                                message: `TRANSACTION COMPLETED SUCCESSFULLY.`,
                                            });
                                        }).catch((err) => {
                                            res.status(400).json({
                                                success: false,
                                                message: "Unable to complete transaction",
                                            });
                                        });
                                })
                            }
                        })
                    }
                })

            })
            .catch((err) => {
                res.status(400).json({
                    success: false,
                    message: err
                })
            })
    }

    // #8
    updateOtp(accountNumber) {
        setTimeout(() => {
            this.sequelize.sync().then(() => {
                this.customer.update({
                    otp: "",
                }, {
                    where: {
                        accountNumber: accountNumber
                    }
                }).then((resp) => {
                    console.log(`otp updated `, resp)
                }).catch((error) => {
                    console.log("An error occured.", error);
                })
            })
        }, 90000);
    }
        // #9
    sendText(phonenumber, message) {
        client.messages
            .create({
                from: "+15017122661",
                body: message,
                to: phonenumber,
            })
            .then((message) => console.log(message.sid));
    }
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
            console.log("Message sent: %s", info.messageId);
            console.log(
                "Preview URL: %s",
                mailer.getTestMessageUrl(info)
            );
        }
        main().catch(console.error);
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
}
