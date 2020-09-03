const express = require("express");
const JWT = require("jsonwebtoken");
const cors = require("cors");
const passport = require("passport");
require("./services/login/loginAuth")(passport);
const  {sequelize }= require("./config/database/dbconnect");


// sequelize.authenticate().then(() => {
  // console.log("Connection has been established successfully.");
// }).catch((error) => {
  // console.log("Unable to connect to the database:", error);
// })

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

app.use("/Api/v1", require("./routes/index"));

app.use((req, res) => {
  res.status(400).json({
    success: "error",
    message: "page not found"
  })
})
app.listen(4000, () => console.log("app is running"));