const express = require("express");
const encrypt = require('bcryptjs');
const db = require("./config/database/dbconnect");
const account = require('./config/nodemailer/mailer');
// we bring in nodemailer so we can send our users 
const nodemailer = require('nodemailer');


const app = express();
// Initilaize all middlewares
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

// console.log(account.gmailAccount())
// create a database connection to the Afrobank db.
db.connect((err) => {
    if(err) {
        console.log("unable to create connection to the database")
    }else {
        console.log("database connected successfully")
    }
})

app.post('/Api/v1/register', (req, res) => {
    const { firstname, lastname, surname, email, phonenumber,  gender } = req.body;

    const accountNumber = Math.floor(Math.random() * 10000000000);
    const accountBalance = 1000;
    const user = {
        firstname,
        surname,
        lastname,
        email,
        phonenumber,
        gender,
        accountNumber,
        accountBalance
    }

    db.query("Insert into customers set ?", user, (err, feedback) => {
        if (err) {
            res.json({
                status:false,
                message: err.sqlMessage
            })
        }
        else {
            const newUser = surname + " " + firstname + " " + lastname;
            const message = `
                <p> Dear <strong> ${newUser.toUpperCase()}</strong>,</p>
                <p> your <strong>Afrobank</strong> account was created successfully, Thank you for banking with us</p>
                <p>below is your account details </p>
                <p>please note that your account number should not be disclosed to anyone.</p>
                <p> welcome to the <strong>Afrobank</strong> family</p>

                <p>account number: ${accountNumber}</p>
                <p>account name:  <strong> ${newUser.toUpperCase()}</strong></p>
                <p>account balance: 10000</p>
            `;
            async function main() {
                // create reusable transporter object using the default SMTP transport
                let transporter = nodemailer.createTransport({
                    host: "smtp.gmail.com",
                    port: 587,
                    secure: false, // true for 465, false for other ports
                    auth: {
                        user: account.gmailAccount().email, // Specific gmail account which can be found in the confi
                        pass: account.gmailAccount().password, // Specific gmail account which can be found in the co
                    },
                    tls: {
                        rejectUnauthorized: false
                    }
                });
                // send mail with defined transport object
                let info = await transporter.sendMail({
                    from: `Afrobank ${account.gmailAccount().email}`, // sender address
                    to: email, //reciever address that was gotten from the frontend/client
                    subject: "Account opening",
                    text:  `Welcome to Afrobank`,
                    html: message
                });
                console.log("Message sent: %s", info.messageId);
                console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
                res.json({
                    status: `Message sent: %s ${info.messageId}`,
                    feedback
                })
            }
            main().catch(console.error);
        }
    })

})

app.post("/Api/v1/login", (req, res) => {
    const { accountnumber, password } = req.body;

    res.json({
        body: req.body
    })
})

app.post("/Api/v1/transfer", (req, res) => {
    const { amount, transactionPin } = req.body;

})

app.get("/Api/v1/balance/:id", (req, res) => {
    const { id } = req.params;
    res.json({
        user_id: req.params
    })
})
app.get("/Api/v1/users", (req, res) => {
    db.query("select * from customers", (err, data)=> {
        if(err) {
            res.sendStatus(404);
        }else {
            res.json({
                data
            })
        }
    })
})


app.listen(4000, () => console.log("app is running"));