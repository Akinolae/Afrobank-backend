const customer = require("../../model/customer");
const Customer = require("../../controller/index");
const { response } = require("../../controller/responseHandler");
const newCustomer = new Customer( customer );
const { fetch_single_user } = require("../../lib/queries");
const { StatusCodes } = require("http-status-codes");
const { transferAuthSchema, transfer } = require("../../lib/constants");



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
                  response(transfer.pinError, false, StatusCodes.UNPROCESSABLE_ENTITY, res);
              }
              else {
                if(isSenderValid.message.accountBalance <= 0){
                  response(transfer.low_balance, false, StatusCodes.UNPROCESSABLE_ENTITY, res);
                } else if(amount > isSenderValid.message.accountBalance ){
                  response(transfer.insufficient_balance, false, StatusCodes.UNPROCESSABLE_ENTITY, res);
                } else {
                  response(transfer.success_message, true, StatusCodes.OK, res);
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
    const { otp, sender, recipient, amount } = req.body;
    const newCustomer = new Customer( customer )
    newCustomer.completeTransfer(res, sender, recipient, amount, otp);
  }
};