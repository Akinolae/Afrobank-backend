'use srict';

class Customer {

    constructor(_sequelize, _customer) {
        this.sequelize = _sequelize
        this.customer = _customer
    }
    // #1
   static register(firstname, lastname, surname, email, phonenumber, gender, res) {
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
                    const newUser = `${surname}  " "  ${firstname}  " "  ${lastname}`;
                    // message to be sent to the newly registered user!
                    const message = `
         <h2  style="color: white; background-color: #2C6975; padding: 30px; width: 50%;"><strong> Afrobank </strong></h2><br>
         <p> Dear <strong> ${newUser.toUpperCase()}</strong>,</p>
         <p> your <strong>Afrobank</strong> account was created successfully, Thank you for banking with us</p>
         <p>below is your account details </p>
         <p>please note that your account number should not be disclosed to anyone.</p>
         <p> welcome to the <strong>Afrobank</strong> family</p>
         <p>account number: ${accountNumber}</p>
         <p>account name:  <strong> ${newUser.toUpperCase()}</strong></p>
         <p>account balance: ${accountBalance}</p>
         `;
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
                        // send mail with defined transport object
                        let info = await transporter.sendMail({
                            from: `Afrobank ${process.env.EMAIL}`, // sender address
                            to: email, //reciever address that was gotten from the frontend/client
                            subject: "Account opening",
                            text: `Welcome to Afrobank`,
                            html: message,
                        });
                        console.log("Message sent: %s", info.messageId);
                        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
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
   static getBalance(id, res) {
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
  static  getUsers(res) {
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
  static userLogin(accountnumber, firstname, res) {
        const nodemailer = require("nodemailer");

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
         Dear ${resp.firstname} ${resp.lastname} ${resp.surname}
         A login attempt was made in your account at ${hours}:${minutes}.
         If this is you kindly ignore, else, contact us at ${customerCareLine}.
         Thank you for choosing AfroBank.
        `
                // send customer a notification.
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
                    // send mail with defined transport object
                    let info = await transporter.sendMail({
                        from: `Afrobank ${process.env.EMAIL}`, // sender address
                        to: resp.email, //reciever address that was gotten from the frontend/client
                        subject: "Account Login",
                        text: `Login notification`,
                        html: message,
                    });
                    console.log("Message sent: %s", info.messageId);
                    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
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
   static getUser(res, accountNumber) {
        this.sequelize.sync().then(() => {
            this.customer.findAll({
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
                res.status(404).json({
                    success: false,
                    message: err
                })
            })
        })
    }

    // #6
   static setPin(accountNumber, pin, res) {
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
        sequelize.sync().then(() => {
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
}

module.exports = Customer