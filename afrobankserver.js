const express = require("express");
const chalk = require('chalk');
const JWT = require("jsonwebtoken");
const cors = require("cors");
const passport = require("passport");
require("./services/login/loginAuth")(passport);
const db = require("./config/database/dbconnect");

const app = express();
// Initilaize all middlewares
app.use(cors());
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

app.use("/Api/v1", require("./routes/index"));
app.listen(4000, () => console.log(chalk.blue.bgBlack.bold("app is running")));