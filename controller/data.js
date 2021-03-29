
const sign_up_message = (newUser, pin, accountBalance, accountNumber) => {
    const msg =    `
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
    return msg;
}

const login_notify = (data) => {

        const date = new Date();
        const hours = date.getHours()
        const minutes = date.getMinutes()
        const customerCareLine = '08183430438';

    const msg = `  <h2  style="color: white; background-color: #2C6975; padding: 30px; width: 50%;"><strong> Afrobank </strong></h2><br>
    <p>Dear <strong> ${data.firstName} ${data.lastName} ${data.surName} </strong></p>
    <p>A login attempt was made in your account at <strong>${hours}:${minutes}</strong>.</p>
    <p>If this is you kindly ignore, else, contact us at <strong>${customerCareLine}</strong>.</p><br>

    <p>Thank you for choosing AfroBank.</p> 
`;
return msg;
}

const sender_transaction_completed_notify = ({user, amount, hours, minutes, sender_balance, recipient}) => {
  const msg =      `
        <h2  style="color: white; background-color: #2C6975; padding: 30px; width: 50%;"><strong>Afrobank debit alert</strong></h2>
        <h4>Dear ${user[0].firstname} ${user[0].lastname} ${user[0].surname}</h4>
        <p>We wish to inform you that a debit transaction just occured on your account with us</p>
        <p style="text-decoration: underline;"><strong>Transaction notification</strong></p>
        <p>Description: CASH-TRANSFER</p>
        <p>Amount     :<strong> ${amount} </strong></p>
        <p>Time       :<strong> ${hours} : ${minutes}</strong></p>
        <p>Balance    : <strong>NGN ${sender_balance}</strong></p>
        <p>Recipient  : <strong>${recipient.accountNumber} ${recipient.firstname} ${recipient.lastname} ${recipient.surname}</strong></p>
        Thank you for banking with <strong> Afrobank </strong>. 
        `;
        return msg
}
const recipient_transaction_completed_notify = ({user, amount, hours, minutes, sender, balance}) => {
    const msg =     `
    <h2 style="color: white; background-color: #2C6975; padding: 30px; width: 50%;"><strong>Afrobank Credit alert</strong></h2><br>
     <h4>Dear ${user.firstname} ${user.lastname} ${user.surname}</h4>
    <p>We wish to inform you that a credit transaction just occured on your account with us</p>
    <p style="text-decoration: underline;"><strong>Transaction notification</strong></p>
   <p>Description : CREDIT</p>
   <p>Amount      : <strong>${amount}</strong></p>
   <p>Time        : <strong>${hours} : ${minutes}</strong></p>
   <p>Balance     : <strong>NGN ${balance}</strong></p>  
   <p>Sender      : <strong>${sender.firstname} ${sender.lastname} ${sender.surname}</strong></p><br>
   Thank you for banking with <strong> Afrobank </strong>. 
   `;
   return msg;
}

const generate_account_no = () => {
    const acc_no = Math.floor(Math.random() * 10000000000);
    return acc_no;
}
module.exports = {
    sign_up_message,
    login_notify,
    sender_transaction_completed_notify,
    recipient_transaction_completed_notify,
    generate_account_no
}