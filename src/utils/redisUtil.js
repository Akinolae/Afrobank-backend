const redis = require('redis')
const url = require('url')

const createRedisConnection = async () => {
  let redisClient

  try {
    if (process.env.NODE_ENV === 'development') {
      if (process.env.REDISCLOUD_URL) {
        const redisURL = url.parse(process.env.REDISCLOUD_URL)
        redisClient = redis.createClient(redisURL.port, redisURL.hostname, {
          no_ready_check: true,
        })
      } else {
        redisClient = await redis.createClient().connect()
      }
    }
  } catch (error) {
    throw error
  }
  return redisClient
}

const redisSet = async (key, payload) => {
  const data = typeof payload === 'object' ? JSON.stringify(payload) : payload
  await createRedisConnection().set(key, data, (err, response) => {
    if (err) throw err
    else return response
  })
}

const keyExists = async (key) => {
  await createRedisConnection().exists(key, (err, res) => {
    if (err) throw err
    else {
      if (res === 1) return true
      else return false
    }
  })
}
const redisGet = async (key) => {
  await keyExists(key)
  createRedisConnection().get(key, (err, reply) => {
    if (err) throw err
    else return reply
  })
}

module.exports = { createRedisConnection, redisGet, redisSet }
