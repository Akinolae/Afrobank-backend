require("dotenv").config();
const client = require("twilio")(process.env.ACC_SID, process.env.AUTH_TOKEN);
class Customer {

    constructor(_sequelize, _customer, _nodemailer) {
        this.sequelize = _sequelize
        this.customer = _customer
        this.nodemailer = _nodemailer
    }
    // #1
    register(firstname, lastname, surname, email, phonenumber, gender, res) {
        const mailer = this.nodemailer;

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
                    async function main() {
                        // create reusable transporter object using the default SMTP transport
                        let transporter = mailer.createTransport({
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
                            to: email, //reciever address that was gotten from the frontend/client
                            subject: "Account opening",
                            text: `Welcome to Afrobank`,
                            html: message,
                        });
                        console.log("Message sent: %s", info.messageId);
                        console.log("Preview URL: %s", mailer.getTestMessageUrl(info));
                    }
                    main().catch(console.error);
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
        const mailer = this.nodemailer;
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
        `
                // send customer a notification.
                async function main() {
                    // create reusable transporter object using the default SMTP transport
                    let transporter = mailer.createTransport({
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
                        to: resp.email, //reciever address that was gotten from the frontend/client
                        subject: "Account Login",
                        text: `Login notification`,
                        html: message,
                    });
                    console.log("Message sent: %s", info.messageId);
                    console.log("Preview URL: %s", mailer.getTestMessageUrl(info));
                }
                main().catch(console.error);
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

    completeTransfer(otp, res) {
        if (!otp) {
            res.status(401).json({
                success: false,
                message: "Input the otp that was sent to your email address."
            })
        } else {
            this.sequelize.sync().then(() => {
                this.customer.findOne({
                    raw: true,
                    where: {

                    }
                })
            })
        }
        const mailer = this.nodemailer;
        const date = new Date();
        //  subtract the amount from the sender
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const transactionAmt = parseInt(amount);
        const senderNewBalance = senderBalance - transactionAmt;
        const recievedTransfer = transactionAmt + reciverBalance;
        const message = "transaction completed successfully";

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

        client.messages
            .create({
                from: "+15017122661",
                body: SenderSms,
                to: Sender.phonenumber,
            })
            .then((message) => console.log(message.sid));

        // recipient
        client.messages
            .create({
                from: "+12059000622",
                body: reciSms,
                to: Recipient.phonenumber,
            })
            .then((message) => console.log(message.sid));

        const senderMsg = `
      <h2  style="color: white; background-color: #2C6975; padding: 30px; width: 50%;"><strong>Afrobank debit alert</strong></h2>
      <h4>${Sender.firstname} ${Sender.lastname} ${Sender.surname}</h4>
      <p>We wish to inform you that a debit transaction just occured on your account with us</p>
      <p style="text-decoration: underline;"><strong>Transaction notification</strong></p>
      <p>Description: CASH-TRANSFER</p>
      <p>Amount     :<strong> ${transactionAmt} </strong></p>
      <p>Time       :<strong> ${hours} : ${minutes}</strong></p>
      <p>Balance    : <strong>NGN ${senderBalance}</strong></p>
      <p>Recipient  : <strong>${Recipient.accountNumber} ${Recipient.firstname} ${Recipient.lastname} ${Recipient.surname}</strong></p>
      Thank you for banking with <strong> Afrobank </strong>. 
      `;

        const recipientMsg = `
          <h2 style="color: white; background-color: #2C6975; padding: 30px; width: 50%;"><strong>Afrobank Credit alert</strong></h2><br>
           <h4>Dear ${Recipient.firstname} ${Recipient.lastname} ${Recipient.surname}</h4>
          <p>We wish to inform you that a credit transaction just occured on your account with us</p>
          <p style="text-decoration: underline;"><strong>Transaction notification</strong></p>
         <p>Description : CREDIT</p>
         <p>Amount      : <strong>${transactionAmt}</strong></p>
         <p>Time        : <strong>${hours} : ${minutes}</strong></p>
         <p>Balance     : <strong>NGN ${recievedTransfer}</strong></p>  
         <p>Sender      : <strong>${Sender.firstname} ${Sender.lastname} ${Sender.surname}</strong></p><br>
        
         Thank you for banking with <strong> Afrobank </strong>. 
         `;

        this.customer.update({
            accountBalance: senderNewBalance,
        }, {
            where: {
                accountNumber: Sender.accountNumber,
            },
        }).then(() => {
            customer
                .update({
                    accountBalance: recievedTransfer,
                }, {
                    where: {
                        accountNumber: Recipient.accountNumber,
                    },
                })
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

module.exports = Customer