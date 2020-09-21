'use strict';
require("dotenv").config();
const {
  Sequelize
} = require("sequelize");
var env = process.env.NODE_ENV || 'development'
const config = require('./config.json')[env];
let sequelize;
if(config.use_env_variable){
   sequelize = new Sequelize(process.env[config.use_env_variable],{dialect: 'mysql'});
  return sequelize;
}else{
   sequelize = new Sequelize(config)
}

module.exports.sequelize = sequelize;