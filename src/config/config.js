const providerInstance = {
  flutterWave: 'flutterWave',
  payStack: 'PayStack',
}

const currentProvider = (instance) => {
  const provider = String(process.env.PROVIDER).toLowerCase()
  return new RegExp(String(instance).toLowerCase()).test(provider)
}

const convertToLowerCase = (params) => {
  params = typeof params !== 'string' ? params.toString() : params
  return params.toLowerCase()
}

const config = {
  uri: process.env.DB_CONNECT,
  email: process.env.EMAIL,
  password: process.env.EMAIL_PASSWORD,
  provider: process.env.PROVIDER,
  token: currentProvider(providerInstance.flutterWave)
    ? process.env.FLUTTERWAVE_TEST
    : currentProvider(providerInstance.payStack)
    ? process.env.PAYSTACK_TEST
    : '',
}

const extractConfig = (param = '') => {
  let value
  param = convertToLowerCase(param)
  if (!param) throw new Error('Params is required')
  if (config[param] === undefined || null) {
    throw new Error(`Unable to fetch ${param}'s config`)
  } else {
    value = config[param]
  }

  return value
}

module.exports = {
  extractConfig,
  providerInstance,
  convertToLowerCase,
}
