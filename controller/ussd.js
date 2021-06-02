module.exports = class Ussd {
  ussdTransaction(sessionId, serviceCode, phoneNumber, text, res) {
    if (text === "") {
      let response = `CON What would you want to check
            
             ACCOUNT BALANCE
             CASHTRANSFER
            `;
      res.send(response);
    } else if (text === 1) {
      let response = `CON Enter a valid account number
            `;
      res.send(response);
    } else if (text === 2) {
      let response = `CON Enter amount
            
            `;
      res.send(response);
    }
  }
};
