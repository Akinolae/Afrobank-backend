const db = require("../../config/database/dbconnect");
const gmail = require("../../config/nodemailer/mailer");
const chalk = require("chalk")
const nodemailer = require("nodemailer");

module.exports = {
   transfer: (req, res) => {
             const { sender, recipient, amount, pin } = req.body;
            // Queries the database, checks if the sender exists in the data bases
             db.query("Select * From customers where accountnumber = ?", [sender], (err, sender) => {
                 if (err) {
                     console.log(chalk.yellow("an error occured"))
                 }
                 // when sender doesn't exist it sends a response
                 if (sender.length === 0) {
                     res.json({
                         status: false,
                         message: "invalid account number"
                     })
                 }
                 // It goes on to check if the recipient also exists
                 else {
                     db.query("Select * From customers where accountnumber = ?", [recipient], (err, data) => {
                         if (err) {
                             res.json({
                                 status: false,
                                 message: err.sqlMessage
                             })
                         }
                         // checks that the recipient also exists and sends an appropriate response
                         if (data.length === 0) {
                             res.json({
                                 status: false,
                                 message: "recipient account number is invalid"
                             })
                         } else {
                             // converts each account balance to integers
                             // the data that is returned is not a number/integer but a string of numbers
                             // account balance of the sender and the reciever.
                             const senderBalance = parseInt(sender[0].accountBalance);
                             const reciverBalance = parseInt(data[0].accountBalance);

                             // Checks that the sennder has a valid account balance before proceeding to the next transaction.
                             if (senderBalance <= 0) {
                                 res.json({
                                     status: false,
                                     message: "your account balance is low"
                                 })
                             }
                             // This one runs when we have a valid account balance.
                             // Here we update the database with appropriate data such as:
                             // the new account balance of the sender and the reciever
                             // Both parties get notified upon completion of the transaction
                             else {
                                 if (amount > senderBalance) {
                                     res.json({
                                         status: false,
                                         message: "insufficient balance"
                                     })
                                 } else {

                                    const date = new Date();
                                    //  subtract the amount from the sender
                                    const hours = date.getHours()
                                    const minutes = date.getMinutes()
                                    const transactionAmt = parseInt(amount);
                                    const newBalance = senderBalance - transactionAmt;
                                    const recievedTransfer = transactionAmt + reciverBalance;
                                    const message = "transaction completed successfully";

                                    //  The sender's message.
                                     const senderMsg = `
                                     <h4>${sender[0].firstname} ${sender[0].lastname} ${sender[0].surname}</h4>
                                     <h2  style="color: white; background-color: #2C6975; padding: 30px; width: 50%;"><strong>Afrobank debit alert</strong></h2><br>
                                     <p>We wish to inform you that a debit transaction just occured on your account with us</p>

                                    <p style="text-decoration: underline;"><strong>Transaction notification</strong></p>

                                     <p>Description: CASH-TRANSFER</p>
                                     <p>Amount     :<strong> ${transactionAmt} </strong></p>
                                     <p>Time       :<strong> ${hours} : ${minutes}</strong></p>
                                     <p>Balance    : <strong>NGN ${newBalance}</strong></p>
                                     <p>Recipient  : <strong>${data[0].accountNumber} ${data[0].firstname} ${data[0].lastname} ${data[0].surname}</strong></p>


                                     Thank you for banking with <strong> Afrobank </strong>. 
                                     `;

                                     const recipientMsg = `
                                      <h4>Dear ${data[0].firstname} ${data[0].lastname} ${data[0].surname}</h4>
                                      <h2 style="color: white; background-color: #2C6975; padding: 30px; width: 50%;"><strong>Afrobank Credit alert</strong></h2><br>
                                      <p>We wish to inform you that a credit transaction just occured on your account with us</p>

                                      <p style="text-decoration: underline;"><strong>Transaction notification</strong></p>
                                         <p>Description : CREDIT</p>
                                         <p>Amount      : <strong>${transactionAmt}</strong></p>
                                         <p>Time        : <strong>${hours} : ${minutes}</strong></p>
                                         <p>Balance     : <strong>NGN ${recievedTransfer}</strong></p>  
                                         <p>Sender      : <strong>${sender[0].firstname} ${sender[0].lastname} ${sender[0].surname}</strong></p><br>

                                         Thank you for banking with <strong> Afrobank </strong>. 
                                     `;
                                     db.query(`Update customers set  accountBalance = ${newBalance} where accountNumber = ${sender[0].accountNumber}`, (err, resp) => {
                                         if (err) throw err;
                                         else {
                                            //  After completing the transaction, both sender and recipient recieve an email
                                            // notification
                                             db.query(`Update customers set accountBalance = ${recievedTransfer} where accountNumber = ${data[0].accountNumber}`, (err, resp) => {
                                                 if (err) throw err;
                                                else {
                                                    // This is for the sender
                                                    async function main() {
                                                        // create reusable transporter object using the default SMTP transport
                                                        let transporter = nodemailer.createTransport({
                                                            host: "smtp.gmail.com",
                                                            port: 587,
                                                            secure: false, // true for 465, false for other ports
                                                            auth: {
                                                                user: gmail.email, // Specific gmail account which can be found in the confi
                                                                pass: gmail.password, // Specific gmail account which can be found in the co
                                                            },
                                                            tls: {
                                                                rejectUnauthorized: false,
                                                            },
                                                        });
                                                        // send mail with defined transport object
                                                        let info = await transporter.sendMail({
                                                            from: `Afrobank ${gmail.email}`, // sender address
                                                            to: sender[0].email, //reciever address that was gotten from the frontend/client
                                                            subject: "DEBIT ALERT",
                                                            text: `A debit transaction occured  on your account with us`,
                                                            html: senderMsg,
                                                        });
                                                        console.log(chalk.green("Message sent: %s", info.messageId));
                                                        console.log(chalk.blue("Preview URL: %s", nodemailer.getTestMessageUrl(info)));
                                                    }
                                                    main().catch(console.error);

                                                    //This is for the recipient
                                                    async function main2() {
                                                        let transporter = nodemailer.createTransport({
                                                            host: "smtp.gmail.com",
                                                            port: 587,
                                                            secure: false, // true for 465, false for other ports
                                                            auth: {
                                                                user: gmail.email, // Specific gmail account which can be found in the confi
                                                                pass: gmail.password, // Specific gmail account which can be found in the co
                                                            },
                                                            tls: {
                                                                rejectUnauthorized: false,
                                                            },
                                                        });
                                                        // send mail with defined transport object
                                                        let info = await transporter.sendMail({
                                                            from: `Afrobank ${gmail.email}`, // sender address
                                                            to: data[0].email, //reciever address that was gotten from the frontend/client
                                                            subject: "CREDIT ALERT",
                                                            text: `A Credit transaction occured  on your account with us`,
                                                            html: recipientMsg,
                                                        });
                                                        console.log("Message sent: %s", info.messageId);
                                                        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
                                                    }
                                                    main2().catch(console.error);
                                                    res.json({
                                                     status: true,
                                                     message: message.toUpperCase()
                                                 })
                                                }
                                             })
                                         }
                                     })
                                 }
                             }
                         }
                     })
                 }
             })
   }
}