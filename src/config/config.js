const config = {
  node_env: process.env.NODE_ENV,
  uri:
    process.env.NODE_ENV === 'development'
      ? process.env.DB_CONNECT
      :
       process.env.DB_CONNECT_PROD,
  email: process.env.EMAIL,
  password: process.env.EMAIL_PASSWORD,
}

const extractConfig = (param = '') => {
  let value
  if (!param) throw new Error('Params is required')
  else if (config[param.toLowerCase()] === undefined || null)
    throw new Error(`Unable to fetch ${param}'s config`)
  else {
    value = config[param.toLowerCase()]
  }
  return value
}

module.exports = {
  extractConfig,
}
