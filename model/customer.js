const {
    sequelize
} = require("../config/database/dbconnect");
const Sequelize = require("sequelize");

const customer = sequelize.define('customer', {
    id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    firstname: {
        type: Sequelize.STRING(45),
        allowNull: false,
    },
    lastname: {
        type: Sequelize.STRING(45),
        allowNull: false
    },
    pin: {
        type: Sequelize.STRING(4),
        allowNull: false
    },
    surname: {
        type: Sequelize.STRING(45),
        allowNull: false
    },
    email: {
        type: Sequelize.STRING(45),
        allowNull: false,
        unique: true
    },
    phonenumber: {
        type: Sequelize.STRING(15),
        allowNull: false
    },
    gender: {
        type: Sequelize.STRING(10),
        allowNull: false
    },
    accountNumber: {
        type: Sequelize.STRING(15),
        allowNull: false,
        primaryKey: true,
        unique: true
    },
    accountBalance: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    createdAt: {
        type: Sequelize.DATE(),
        allowNull: false
    }
})

const transactionHist = sequelize.define('History', {
    transaction_id: {
        type: Sequelize.STRING(12),
        allowNull: false
    },
    customer_id: {
        type: Sequelize.STRING(15),
        allowNull: false,
    }
})

module.exports = {
    customer: customer,
    history: transactionHist
};