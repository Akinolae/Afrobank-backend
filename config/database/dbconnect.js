"use strict";
require("dotenv").config();
const mongoose = require("mongoose");
const connect = async () => {
  try {
    await mongoose.connect(process.env.DB_CONNECT, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("connection established");
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  connect,
};
