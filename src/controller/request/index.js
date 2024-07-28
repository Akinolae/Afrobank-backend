const { default: axios } = require('axios')

class ExternalAPIrequest {
  constructor() {
    this.apiKey = process.env.AFROBANK_CARDS
  }

  APIrequestErrorParser = (error) => {
    error = typeof error === 'object' ? error : JSON.stringify(error)

    return !!error.response.data
      ? error.response.data.message
      : !!error.message
      ? error.message
      : error
  }

  APIrequestDataParser = (args) => {
    return args.data.message
  }

  makeExternalAPIPostrequest = async (args) => {
    const { url, data } = args

    try {
      const res = await axios.post(url, data, {
        headers: {
          'x-api-key': this.apiKey,
        },
      })

      return this.APIrequestDataParser(res)
    } catch (error) {
      throw this.APIrequestErrorParser(error)
    }
  }
}

const externalAPIrequest = new ExternalAPIrequest()
Object.freeze(externalAPIrequest)

module.exports = { externalAPIrequest }
