'use strict';
require("dotenv").config();

const {
  Sequelize
} = require("sequelize");
const env = process.env.NODE_ENV;
const url = require("url");
const config = require('../config.json')[env];
// console.log(config);
// console.log(process.env);
// console.log(config);
const herokuUrl = url.parse('process.env[config.use_env_variable]');
// console.log(herokuUrl);

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(herokuUrl, {
    dialect: "mysql"
  });
} else {
  sequelize = new Sequelize(config)
}
const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize
module.exports = db;