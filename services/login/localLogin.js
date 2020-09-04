    const {
        customer
    } = require("../../model/customer");
    const nodemailer = require("nodemailer");
    require("dotenv").config();

    module.exports = {
        localLogin: (req, res) => {
            const {
                accountnumber,
                firstname
            } = req.body;

            var message;
            if (!accountnumber) {
                res.status(400).json({
                    success: false,
                    message: "Account number is required"
                })
            } else {
                customer.findOne({
                    raw: true
                }, {
                    where: {
                        accountNumber: accountnumber
                    }
                }).then((resp) => {

                    const date = new Date();
                    const hours = date.getHours()
                    const minutes = date.getMinutes()
                    const customerCareLine = 08183430438;
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
                    if(firstname !== resp.firstname){
                        res.status(401).json({
                            success: false,
                            message: "Invalid login parameters"
                        })
                    }else {
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
    }