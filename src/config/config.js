const flutterWaveInstances = [
  'flutterWave',
  'Flutterwave',
  'flutterWave',
  'FLUTTERWAVE',
]
const payStackInstances = ['payStack', 'paystack', 'Paystack', 'PAYSTACK']

const config = {
  node_env: process.env.NODE_ENV,
  uri:
    process.env.NODE_ENV === 'development'
      ? process.env.DB_CONNECT
      : process.env.DB_CONNECT_PROD,
  email: process.env.EMAIL,
  password: process.env.EMAIL_PASSWORD,
  provider: process.env.PROVIDER,
  token: flutterWaveInstances.includes(process.env.PROVIDER)
    ? process.env.FLUTTERWAVE_TEST
    : payStackInstances.includes(process.env.PROVIDER)
    ? process.env.PAYSTACK_TEST
    : '',
}

const extractConfig = (param = '') => {
  let value
  if (!param) throw new Error('Params is required')
  if (config[param.toLowerCase()] === undefined || null) {
    throw new Error(`Unable to fetch ${param}'s config`)
  } else {
    value = config[param.toLowerCase()]
  }

  return value
}

module.exports = {
  extractConfig,
}
