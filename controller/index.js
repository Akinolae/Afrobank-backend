require("dotenv").config();
const { response } = require('./responseHandler');
const nodemailer = require("nodemailer");
const otpGenerator = require('otp-generator')
const statusCode = require('http-status-codes');
const messages = require("./data");
const { calc_account_balance, fetch_single_user } = require("../lib/queries");
const { generate_account_no } = require('./data');
const { user_login, user_reg, authSchema, otp_messsage, setPinSchema, pinReset } = require("../lib/constants");

module.exports = class Customer {
    constructor( _customer) {
        this.customer = _customer
    }
    // #1
  async register(firstName, lastName, surName, email, phoneNumber, gender, res) {
        // CREATES VIRTUAL ACCOUNT NUMBERS AND DEFAULT PINS
        const accountNumber = generate_account_no();
        const accountBalance = process.env.DEFAULT_BALANCE;
        const pin = process.env.DEFAULT_PIN

        const user = {
            firstName,
            surName,
            lastName,
            email,
            phoneNumber,
            gender,
            accountNumber,
            accountBalance,
            pin
        };
            const joi_validate = authSchema.validate({ firstName, surName, lastName, email, phoneNumber, gender, });
            if(joi_validate.error){
                response(joi_validate.error.details[0].message, false,  statusCode.StatusCodes.UNPROCESSABLE_ENTITY, res )
            }
            else {
                try {
                    let user_model = await new this.customer(user);
                    await user_model.save();
                    this.sendMail( messages.sign_up_message( firstName, pin, accountBalance, accountNumber ),
                    email, user_reg.reg_mail_subject, user_reg.reg_mail_text);
                    response(user_reg.resp_msg_registration, true, statusCode.StatusCodes.OK, res)
                }
                catch (err) {
                    response(user_reg.registration_error, false, statusCode.StatusCodes.UNPROCESSABLE_ENTITY, res);
                    }
                }
    }

    // #2
    // returns the account balance of the specified user. 
    async getBalance  (accountNumber, res) {
       const data = await calc_account_balance(accountNumber);
        !data.status ?  response(data.message, false, statusCode.StatusCodes.BAD_REQUEST, res):
          response(data, true, statusCode.StatusCodes.OK, res)
        
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
   async login(accountNumber, firstName, res) {
        if( !accountNumber || !firstName ) {
            response(user_login.credentials, false, statusCode.StatusCodes.UNPROCESSABLE_ENTITY, res) 
        } else {
            const data = await fetch_single_user(accountNumber);
            if(data.message.accountNumber !== accountNumber && data.message.firstName !== firstName){
                response(user_login.invalid_credentials, false, statusCode.StatusCodes.FORBIDDEN, res);
            } 
            else {
                response(user_login.login_success, true, 200, res, null, data.message)
                this.sendMail(messages.login_notify(data.message), data.message.email, user_login.email_subject, user_login.email_text);
            }
        }
    }
    // #5
     getUser = async (accountNumber, res) => {
        const user = await fetch_single_user(accountNumber);
        const user_details = {
            firstname: user.message.firstName,
            surname: user.message.surName,
            lastName: user.message.lastName
        }
        user.status ? response(user_details, true, statusCode.StatusCodes.OK, res):
        response(user.message, false, statusCode.StatusCodes.NOT_FOUND, res)
    }

    // #6
    async setPin(accountNumber, pin, res) {
        const isValidated = setPinSchema.validate({ accountNumber, pin});
        if(isValidated.error) {
            response(isValidated.error.message, false, statusCode.StatusCodes.UNPROCESSABLE_ENTITY, res)
        }else {
            try {
                const user = await fetch_single_user(accountNumber);
                if(user.status){
                    await this.customer.updateOne({'accountNumber': user.message.accountNumber}, {$set: {'pin': pin}})
                    .then(() => {
                        response(pinReset.message, true, statusCode.StatusCodes.OK, res )
                        this.sendMail(pinReset.emailTemplate(user.message.firstName), user.message.email, "Afrobank pin reset", "pin")
                         }
                    )
                    .catch((err) => {
                        // response(pinReset.error, true, statusCode.StatusCodes.UNPROCESSABLE_ENTITY, res )
                        console.log(err)
                    })
                }else {
                    console.log(user.status)
                }
            }catch(err) {
                console.log(err)
            }
        }
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
                this.customer.updateOne({ accountNumber: accountNumber }, {$set: {otp:null}})
        }, 900000);
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
   async sendOtp (payload) {
       const { accountNumber, email, firstName } = payload;
       try {
           const otp = otpGenerator.generate(5, {
               alphabets: false,
               digits: true,
               specialChars: false,
               upperCase: false
             })
             await this.customer.updateOne({ accountNumber: accountNumber}, {$set: {otp: otp}})
                .then(() => 
                this.sendMail(otp_messsage.template(firstName, otp), email, otp_messsage.subject, otp_messsage.text))
                .catch((err) => {throw err})
       } catch (err) {
           console.log(err)
       }
   }
}