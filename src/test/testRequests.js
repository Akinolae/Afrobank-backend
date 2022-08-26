'use strict'
require('dotenv').config()

const axios = require('axios')
const mongoose = require('mongoose')
const customerModel = require('../model/customer')
const { verifyAccountNumber, fetch_single_user } = require('../utils/userUtil')
const {
  generateRandomEmail,
  transactionHistory,
  fetchAllNotifications,
  calc_account_balance,
  // createAccountNumber,
  createPin,
} = require('../utils')
const { appConfig } = require('../config/')

beforeAll((done) => {
  function connect() {
    appConfig({ type: 'db' }, process.env.DB_CONNECT)
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
  baseURL:
    process.env.NODE_ENV === 'test'
      ? process.env.AXIOS
      : process.env.AXIOS_PROD,
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
          password: process.env.EMAIL_PASSWORD,
        })
        expect(result.status).toBe(200)
      })
    })
  },

  createPin: () => {
    describe('create pin', () => {
      test('should create a pin for the user', () => {
        const response = createPin()
        expect(response.length).toBe(4)
        expect(response).not.toBeNull()
      })
    })
  },
  // createAccountNumber: () => {
  //     describe('create accountNumber', () => {
  //         test('should create accountNumber', async () => {
  //             const response = await createAccountNumber()
  //             console.log(response.length)
  //             // expect(response.length).toBe (10)
  //             // expect(response).not.toBeNull()
  //         })
  //     })
  // },
  fetchTransactionHistory: () => {
    describe('Validate user email', () => {
      test('should return an  invalid user', async () => {
        const response = await fetch_single_user(process.env.EMAIL_TEST)
        expect(response.status).toBe(false)
      })
    })
  },
  calculateAccountBalance: () => {
    describe('Calculate account balance', () => {
      test('Should return an object', async () => {
        const resp = await calc_account_balance(process.env.ACCOUNTNUMBER)
        expect(resp).not.toBeNull()
      })
    })
  },
  fetchAllNotifications: () => {
    describe('Notifications', () => {
      test('Should return an array of notifications', async () => {
        const data = await fetchAllNotifications(process.env.ACCOUNTNUMBER)
        expect(data.status).toBe(true)
        expect(data.response).not.toBeNull()
      })
    })
  },
  verifyUserEmail: () => {
    describe('Transaction history', () => {
      test('Returns updated transaction history of a single user', async () => {
        const data = await transactionHistory(process.env.ACCOUNTNUMBER)
        expect(data.response).not.toBeNull()
      })
    })
  },

  shouldNotRegisterExistingUser: () => {
    describe('POST@/register', () => {
      test('it should not register a new user to the platform', async () => {
        const result = await API_GATEWAY.post('/register', {
          firstName: 'Adeleye',
          lastName: 'Makinde',
          email: process.env.ACCOUNTNUMBER,
          phoneNumber: '08034335043',
          gender: 'male',
          password: generateRandomEmail(),
        })
        expect(result.status).toBe(422)
      })
    })
  },
  connectDb: () => {
    describe('DB connect', () => {
      test('Ensure that database connects', () => {
        const response = appConfig({ type: 'db' }, process.env.DB_CONNECT)
        expect(response).toBe(true)
      }, 30000)
    })
  },

  getBalance: () => {
    describe('GET@/balance', () => {
      test('Returns the account balance of a single user', async () => {
        const response = await verifyAccountNumber(process.env.ACCOUNTNUMBER)
        expect(response.user.accountBalance).not.toBeNull()
      })
    })
  },
  transfer: () => {
    describe('POST@/transfer', () => {
      test('Customer should not be able to transfer cash between customers', async () => {
        const result = await API_GATEWAY.post('/transfer', {
          sender: process.env.ACCOUNTNUMBER,
          recipient: process.env.RECIPIENT,
          amount: 500,
          pin: process.env.PIN,
        })
        expect(result.status).toBe(404)
      })
    })
  },
  customerLogin: () => {
    describe('POST@/login', () => {
      test('Validates that the user that logged in is an invalid user', async () => {
        const result = await API_GATEWAY.post('/login', {
          email: process.env.EMAIL_TEST,
          password: process.env.EMAIL_PASSWORD,
        })
        expect(result.statusCode).toBe(401)
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
        const result = await verifyAccountNumber(process.env.ACCOUNTNUMBER)
        expect(result.status).toBe(true)
      })
    })
  },
}

module.exports = tests
