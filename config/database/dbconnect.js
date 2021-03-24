'use strict';
require("dotenv").config();
const mongoose = require('mongoose')
const URI = "mongodb+srv://Afrobank:akinola@1@afrobank.wkpfb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const connect = async () => {
  try {
    await mongoose.connect(URI, { useNewUrlParser: true,  useUnifiedTopology: true  });
    console.log('connection established')
  }
  catch(err) {
    console.log(err)
  }
}

module.exports = {
  connect,
}