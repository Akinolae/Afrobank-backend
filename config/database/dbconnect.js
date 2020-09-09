'use strict';
require("dotenv").config();
const {
  Sequelize
} = require("sequelize");

  const sequelize = new Sequelize(
    process.env.DATABASE,
    process.env.USER,
    process.env.PASSWORD, {
      host: process.env.HOST,
      dialect: 'mysql',
      pool: {
        max: 1000,
        min: 10,
        idle: 1000
      }
    }
  );


module.exports.sequelize = sequelize;