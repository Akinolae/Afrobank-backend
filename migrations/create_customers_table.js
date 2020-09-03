'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        queryInterface.createTable("customers", {
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
            surname: {
                type: Sequelize.STRING(45),
                allowNull: false
            },
            email: {
                type: Sequelize.STRING(45),
                allowNull: false
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
                primaryKey: true
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
    },
    down: (queryInterface, Sequelize) => {
        queryInterface.dropTable("customers")
    }
}