const express = require("express");
const chalk = require('chalk');
const JWT = require("jsonwebtoken");
const db = require("./config/database/dbconnect");
const transaction = require('./services/cashTransfer/cashtransfer')
const userReg = require("./services/Register/register");
const userBalance = require("./services/getBalance/getBalance");
const passport = require("passport");
require("./services/login/loginAuth")(passport);

// we bring in nodemailer so we can send our users
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

app.post("/Api/v1/register", userReg.register);

app.post("/Api/v1/login", (req, res) => {
  const { accountnumber, firstname } = req.body;
  db.query(
    "SELECT * FROM customers Where accountnumber = ?",
    [accountnumber],
    (err, data) => {
      if (err) {
        throw err;
      } else {
        if (err) {
          res.json({
            message: `invalid user`,
          });
        }
        const user = data[0].firstname;
        if (firstname !== user) {
          res.json({
            status: false,
            message: "invalid login parameters",
          });
        } else {
          res.json({
            status: true,
            message: "login successful",
          });
        }
      }
    }
  );
});

// money transfer;
app.post("/Api/v1/transfer", transaction.transfer);

// Checks for the available balance of that specific user.
app.get("/Api/v1/balance/:id", userBalance.getAccountBalance);
app.get("/Api/v1/users", (req, res) => {
  db.query("select * from customers", (err, data) => {
    if (err) {
      res.sendStatus(404);
    } else {
      // const newData = JWT.sign(data[0], "Afrobank");
      res.json({
        data:data[0],
      });
    }
  });
});

app.listen(4000, () => console.log(chalk.blue.bgBlack.bold("app is running")));