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
                                         message: "unable to complete transaction"
                                     })
                                 } else {

                                    const date = new Date();
                                    //  subtract the amount from the sender
                                    const transactionAmt = parseInt(amount);
                                    const newBalance = senderBalance - transactionAmt;
                                    const recievedTransfer = transactionAmt + reciverBalance;
                                    const message = "transaction completed successfully";

                                    //  The sender's message.
                                     const senderMsg = `
                                     <h6 style="text-decoration: underline;"><strong>Afrobank debit alert</strong</h6>
                                     <p>We wish to inform you that a debit transaction just occured on your account with us</p>
                                      
                                      <h6 style="text-decoration: underline;"><strong>Transaction notification</strong</h6>
                                     Description: CASH-TRANSFER
                                     Amount     : ${transactionAmt}
                                     Time       : ${date.getHours} : ${date.getMinutes()}
                                     Balance    : ${newBalance}
                                     Recipient  : ${data.accountNumber} ${data.firstname} ${data.lastname} ${data.surname}


                                     Thank you for banking with us. 
                                     `;

                                     const recipientMsg = `
                                      <h6 style="text-decoration: underline; color:"red"><strong>Afrobank Credit alert</strong</h6>
                                      <p>We wish to inform you that a credit transaction just occured on your account with us</p>

                                      <h6 style="text-decoration: underline;"><strong>Transaction notification</strong</h6>
                                         Description : CREDIT
                                         Amount      : ${transactionAmt}
                                         Time        : ${date.getHours} : ${date.getMinutes()}
                                         Balance     : ${recievedTransfer}  
                                         Sender      : ${sender.firstname.toUpperCase()} ${sender.lastname.toUpperCase()} ${sender.surname.toUpperCase()}

                                         Thank you for banking with us. 
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
                                                                user: gmail.gmailAccount().email, // Specific gmail account which can be found in the confi
                                                                pass: gmail.gmailAccount().password, // Specific gmail account which can be found in the co
                                                            },
                                                            tls: {
                                                                rejectUnauthorized: false,
                                                            },
                                                        });
                                                        // send mail with defined transport object
                                                        let info = await transporter.sendMail({
                                                            from: `Afrobank ${gmail.gmailAccount().email}`, // sender address
                                                            to: sender.email, //reciever address that was gotten from the frontend/client
                                                            subject: "Debit alert",
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
                                                                user: gmail.gmailAccount().email, // Specific gmail account which can be found in the confi
                                                                pass: gmail.gmailAccount().password, // Specific gmail account which can be found in the co
                                                            },
                                                            tls: {
                                                                rejectUnauthorized: false,
                                                            },
                                                        });
                                                        // send mail with defined transport object
                                                        let info = await transporter.sendMail({
                                                            from: `Afrobank ${gmail.gmailAccount().email}`, // sender address
                                                            to: data.email, //reciever address that was gotten from the frontend/client
                                                            subject: "Credit alert",
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