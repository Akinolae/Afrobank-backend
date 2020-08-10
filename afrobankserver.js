const express = require("express");
const chalk = require('chalk');
const JWT = require("jsonwebtoken");
const passport = require("passport");
require("./services/login/loginAuth")(passport);


const db = require("./config/database/dbconnect");
const transaction = require('./services/cashTransfer/cashtransfer')
const userReg = require("./services/Register/register");
const userBalance = require("./services/getBalance/getBalance");
const getUser = require("./services/getUsers/getUsers");
const localLogin = require("./services/login/localLogin");
const transactionHistory = require("./services/transactionHistory/getTransactionHistory");

const app = express();
// Initilaize all middlewares
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// console.log(account.gmailAccount())
// create a database connection to the Afrobank db.
db.connect((err) => {
  if (err) {
    console.log(chalk.yellow("unable to create connection to the database"));
  } else {
    console.log(chalk.yellow("database connected successfully"));
  }
});
// intialize the url for the API;
const url = "/Api/v1";

app.post(`${url}/register`, userReg.register);

// Login user
app.post(`${url}/login`, localLogin.localLogin);

// money transfer;
app.post(`${url}/transfer`, transaction.transfer);

// Checks for the available balance of that specific user.
app.get(`${url}/balance/:id`, userBalance.getAccountBalance);

// deletes a particular user;
app.get(`${url}/delete/:id`)
// returns all users/customers/account
app.get(`${url}/users`, getUser.getUsers);
// returns the transaction history of a particular user
app.get(`${url}/history/:id`, transactionHistory.getTransactionHistory)

app.listen(4000, () => console.log(chalk.blue.bgBlack.bold("app is running")));