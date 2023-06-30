const date = new Date()
const hours = date.getHours()
const minutes = date.getMinutes()

const template = {
  welcomeTemplate: (name) => `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Welcome</title>
    </head>
    <body>${name}</body>
  </html>
  `,
  registerationSuccess: (newUser, pin, accountBalance, accountNumber) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <body>
      <section style="background-color: aquamarine;">
          <div style="display: flex; justify-content: center; align-items: center; flex-direction: column;">
              <h5>AfroBank</h5>
              <p>Your trusted life partner</p>
          </div>
      </section>
      <section>
      <div>
          <h4>Dear <strong>${newUser.toUpperCase()}</strong>,</h4>
      </div>
      </section>
      <section>
          <p> your <strong>Afrobank</strong> account was created successfully, Thank you for banking with us</p>
          <p>below is your account details </p>
          <p>please note that your account details should not be disclosed to anyone.</p>
          <p> welcome to the <strong>Afrobank</strong> family</p>
          <h3 style="font-weight: bold; font-size: 18px;">account number: <strong>${accountNumber}</strong></h3>
          <h3 style="font-weight: bold; font-size: 18px;">account name:  <strong> ${newUser.toUpperCase()}</strong></h3>
          <h3 style="font-weight: bold; font-size: 18px;">account balance:<strong> ${accountBalance}</strong></h3>
          <h3 style="font-weight: bold; font-size: 18px;">default pin:<strong> ${pin}</strong></h3>
          <h3 style="font-weight: bold; font-size: 18px;"> we urge you to change your transaction pin upon login and keep them confidential.</h3>
           <h3 style="font-weight: bold; font-size: 18px;">Thank you for choosing <strong>Afrobank</strong>.</h3>
      </section>
  </body>
  </html>
  
  `,
  transferSent: (
    firstName,
    surName,
    lastName,
    recipient,
    recipientFirstName,
    recipientSurname,
    recipientLastName,
    amount,
    senderNewBalance
  ) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
    </head>
    <body>
        <section>
            <h2  style="color: white; background-color: #2C6975; padding: 30px; width: 50%;"><strong>Afrobank debit alert</strong></h2>
            <h4>Dear ${firstName} ${lastName} ${surName}</h4>
            <p>We wish to inform you that a debit transaction just occured on your account with us</p>
            <p style="text-decoration: underline;"><strong>Transaction notification</strong></p>
            <p>Description: CASH-TRANSFER</p>
            <p>Amount     :<strong> ${amount} </strong></p>
            <p>Time       :<strong> ${hours} : ${minutes}</strong></p>
            <p>Balance    : <strong>NGN ${senderNewBalance}</strong></p>
            <p>Recipient  : <strong>${recipient} ${recipientFirstName} ${recipientLastName} ${recipientSurname}</strong></p>
            Thank you for banking with <strong> Afrobank </strong>. 
        </section>
    </body>
    </html>
    
    `,
  otp: (name, otp) =>
    `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
    </head>
    <body>
        <section style="background-color: aquamarine;">
            <div style="display: flex; justify-content: center; align-items: center;">
                <h5>AfroBank</h5>
                <p>Your trusted life partner</p>
            </div>
        </section>
        <section>
        <div>
            <h4>Dear <b>${name}</b>,</h4>
        </div>
        </section>
        <section>
                <h3 style="font-weight: bold; font-size: 18px;">Your otp is ${otp}</h3>
        </section>
    </body>
    </html>
    `,
  pin: (name) =>
    `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
    </head>
    <body>
        <section style="background-color: aquamarine;">
            <div style="display: flex; justify-content: center; align-items: center;">
                <h5>AfroBank</h5>
                <p>Your trusted life partner</p>
            </div>
        </section>
        <section>
        <div>
            <h4>Dear <b>${name}</b>,</h4>
        
        </div>
        </section>
        <section>
                <h3 style="font-weight: bold; font-size: 18px;">pin reset successful</h3>
        </section>
    </body>
    </html>
    `,
}

module.exports = { template }
