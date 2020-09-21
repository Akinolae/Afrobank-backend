const db = require("../config/database/dbconnect"),
    sequelize = db.sequelize,
    Sequelize = db.Sequelize;
// console.log(sequelize.define())
 customer = sequelize.define('customer', {
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
            type: Sequelize.INTEGER(4),
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
            type: Sequelize.BIGINT,
            allowNull: false,
            primaryKey: true,
            unique: true
        },
        accountBalance: {
            type: Sequelize.BIGINT,
            allowNull: false
        },
        createdAt: {
            type: Sequelize.DATE(),
            allowNull: false
        },
        otp: {
            type: Sequelize.BIGINT,
            allowNull: true
        }
    }),
    transactionHist = sequelize.define('History', {
        transaction_id: {
            type: Sequelize.STRING(12),
            allowNull: false
        },
        transactionType: {
            type: Sequelize.STRING(10),
            allowNull: false
        },
        transactionDate: {
            type: Sequelize.DATE(),
            allowNull: false
        },
    })

transactionHist.belongsTo(customer, {
    foreignKey: 'accountNumber'
})

module.exports = {
    customer,
    transactionHist
};