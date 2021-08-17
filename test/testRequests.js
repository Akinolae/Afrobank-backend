'use strict'
require('dotenv').config()

const axios = require('axios')
const mongoose = require('mongoose')
const newCustomer = require('../controller/userManagement')
const customerModel = require('../model/customer')
const customerTransactions = require('../controller/transactions/')
const { verifyAccountNumber, fetch_single_user } = require('../utils/userUtil')
const { generateRandomEmail } = require('../utils')
const { dbConfigure } = require('../config/database/dbconnect')

beforeAll((done) => {
    async function connect() {
        await dbConfigure(process.env.DB_CONNECT)
    }
    connect()
    done()
})

afterAll((done) => {
    async function closeConnection() {
        await mongoose.connection.close()
    }
    closeConnection()
    done()
})

const API_GATEWAY = axios.create({
    baseURL: process.env.AXIOS,
})

const tests = {
    registerCustomer: () => {
        describe('POST@/register', () => {
            test('it should register a new user to the platform', async () => {
                const result = await API_GATEWAY.post('/register', {
                    firstName: 'Adeleye',
                    lastName: 'Makinde',
                    surName: 'Pamilerin',
                    email: generateRandomEmail(),
                    phoneNumber: '08034335043',
                    gender: 'male',
                    password: 'thegreatest@1',
                })
                expect(result.status).toBe(200)
            })
        })
    },

    shouldNotRegisterExistingUser: () => {
        describe('POST@/register', () => {
            test('it should not register a new user to the platform', async () => {
                const result = await API_GATEWAY.post('/register', {
                    firstName: 'Adeleye',
                    lastName: 'Makinde',
                    surName: 'Pamilerin',
                    email: process.env.ACCOUNTNUMBER,
                    phoneNumber: '08034335043',
                    gender: 'male',
                    password: 'thegreatest@1',
                })
                expect(result).toBe(422)
            })
        })
    },
    connectDb: () => {
        describe('DB connect', () => {
            test('Ensure that database connects', async () => {
                const response = await dbConfigure(process.env.DB_CONNECT)
                expect(response).toBe(true)
            }, 30000)
        })
    },

    getBalance: () => {
        describe('GET@/balance', () => {
            test('Returns the account balance of a single user', async () => {
                const response = await verifyAccountNumber(
                    process.env.ACCOUNTNUMBER
                )
                expect(response.user.accountBalance).not.toBeNull()
            })
        })
    },
    transfer: () => {
        describe('POST@/transfer', () => {
            test('Customer should be able to transfer cash between customers', async () => {
                const result = await API_GATEWAY.post('/transfer', {
                    sender: process.env.ACCOUNTNUMBER,
                    recipient: process.env.RECIPIENT,
                    amount: 500,
                    pin: process.env.PIN,
                })
                expect(result.status).toBe(200)
            })
        })
    },
    customerLogin: () => {
        describe('POST@/login', () => {
            test('Validates that the user that logged in is the valid user', async () => {
                const result = await API_GATEWAY.post('/login', {
                    email: process.env.EMAIL_TEST,
                    password: process.env.EMAIL_PASSWORD,
                })
                expect(result.status).toBe(200)
            })
        })
    },
    failCustomerLogin: () => {
        describe('POST@/login', () => {
            test('Validates that the user is not a valid user', async () => {
                const result = await API_GATEWAY.post('/login', {
                    email: process.env.EMAIL_TEST,
                    password: process.env.PASSWORD,
                })
                expect(result.status).toBeGreaterThanOrEqual(400)
            })
        })
    },
    customerModel: () => {
        describe('@checks that the dataBase model is not null', () => {
            test('Validates table is not null', async () => {
                expect(customerModel).not.toBeNull()
            })
        })
    },

    validateAccount: () => {
        describe('@POST/Validate', () => {
            test('Validates that the account number is valid', async () => {
                const result = await verifyAccountNumber(
                    process.env.ACCOUNTNUMBER
                )
                expect(result.status).toBe(true)
            })
        })
    },
}

module.exports = tests
