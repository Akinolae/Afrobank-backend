'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("customer", {
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
        })
    },
    down: (queryInterface, Sequelize) => {
            return queryInterface.dropTable("customer")
    }
}