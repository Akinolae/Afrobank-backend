'use strict';
require("dotenv").config();
const {
  Sequelize
} = require("sequelize");
const env = process.env.NODE_ENV || 'development'
const url = require("url");
const config = require('./config.json')[env];
const herokuUrl = url.parse('process.env[config.use_env_variable]');
let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(herokuUrl, {
    dialect: 'mysql',
      logging: true //false
  });
} else {
  sequelize = new Sequelize(config)
}
const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize
module.exports = db;