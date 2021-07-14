const { fetch_single_user } = require('./userUtil')

const generate_account_no = () => {
    const acc_no = Math.floor(Math.random() * 10000000000)
    return acc_no
}

const createAccountNumber = async () => {
    try {
        const accountNumber = generate_account_no()
        const isAccountNumberExists = await fetch_single_user(accountNumber)

        if (!isAccountNumberExists.status) {
            return accountNumber
        } else {
            return
        }
    } catch (error) {
        throw error
    }
}

module.exports = createAccountNumber
