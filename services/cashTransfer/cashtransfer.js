const customer = require("../../model/customer");
const otpGenerator = require('otp-generator');
const Customer = require("../../controller/index");
const { response } = require("../../controller/responseHandler");
const newCustomer = new Customer( customer );
const { fetch_single_user } = require("../../lib/queries");
const { StatusCodes } = require("http-status-codes");
const { transferAuthSchema, transferError } = require("../../lib/constants");



module.exports = {
  transfer: async (req, res) => {
    const { sender, recipient, amount, pin } = req.body;
    const joi_error = transferAuthSchema.validate({sender, recipient, amount, pin});
    if(joi_error.error){
      response(joi_error.error.details[0].message, false, StatusCodes.UNPROCESSABLE_ENTITY, res)
    }
    else {
        try{
              const isSenderValid = await fetch_single_user(sender);
              const isRecipientValid = await fetch_single_user(recipient);

          if(isRecipientValid.status && isSenderValid.status){
              if(isSenderValid.message.pin !== pin){
                  response(transferError.pinError, false, StatusCodes.UNPROCESSABLE_ENTITY, res);
              }
              else {
                if(isSenderValid.message.accountBalance <= 0){
                  response(transferError.low_balance, false, StatusCodes.UNPROCESSABLE_ENTITY, res);
                } else if(amount > isSenderValid.message.accountBalance ){
                  response(transferError.insufficient_balance, false, StatusCodes.UNPROCESSABLE_ENTITY, res);
                } else {
                    newCustomer.sendOtp(sender);
                }
              }
          }
          else if(!isRecipientValid.status) {
            response(`Recipient ${isRecipientValid.message}`, false, StatusCodes.UNPROCESSABLE_ENTITY, res)
          }
          else if(!isSenderValid.status){
            response(`Sender ${isSenderValid.message}`, false, StatusCodes.UNPROCESSABLE_ENTITY, res)
            }
          }
        catch (error) {
            response(error, false, StatusCodes.FORBIDDEN, res);
        }
   }
  },
  completeTransfer: (req, res) => {
    const {
      otp,
      sender,
      recipient,
      amount
    } = req.body;
    const newCustomer = new Customer(sequelize, customer)
    newCustomer.completeTransfer(res, sender, recipient, amount, otp);
  }
};