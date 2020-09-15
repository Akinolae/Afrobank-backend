'use strict';
require("dotenv").config();
const {
  Sequelize
} = require("sequelize");
const url = require("url");
const optionsProduction = url.parse('process.env.DATABASE_URL');
const optionsDevelopment = process.env.DATABASE
const sequelizeOptions = process.env.NODE_ENV === 'production' ? optionsProduction : optionsDevelopment

  const sequelize = new Sequelize(
    sequelizeOptions,
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