const db = require("../../config/database/dbconnect");
const nodemailer = require("nodemailer");
require("dotenv").config();

module.exports = {
    register: (req, res) => {
        const {
            firstname,
            lastname,
            surname,
            email,
            phonenumber,
            gender
        } = req.body;
        const accountNumber = Math.floor(Math.random() * 10000000000);
        const accountBalance = 10000;

        const user = {
            firstname,
            surname,
            lastname,
            email,
            phonenumber,
            gender,
            accountNumber,
            accountBalance,
        };

        db.query("Insert into customers set ?", user, (err, feedback) => {
            if (err) {
                res.status(400).json({
                    status: false,
                    message: err,
                });
            }
             else {
                const newUser = `${surname}  " "  ${firstname}  " "  ${lastname}`;
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
            }
        });
    }
}