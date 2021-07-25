const redis = require('redis')
const url = require('url')

const createRedisConnection = () => {
    let redisClient

    try {
        if (process.env.NODE_ENV === 'development') {
            if (process.env.REDISCLOUD_URL) {
                const redisURL = url.parse(process.env.REDISCLOUD_URL)
                redisClient = redis.createClient(
                    redisURL.port,
                    redisURL.hostname,
                    {
                        no_ready_check: true,
                    }
                )
            } else {
                redisClient = redis.createClient()
            }
        }
    } catch (error) {
        throw error
    }
    return redisClient
}

const redisSet = (key, payload) => {
    const data = typeof payload === 'object' ? JSON.stringify(payload) : payload
    createRedisConnection().set(key, data, (err, response) => {
        if (err) {
            console.error(err)
        } else {
            return response
        }
    })
}

const keyExists = (key) => {
    createRedisConnection().exists(key, (err, res) => {
        if (err) {
            throw err
        } else {
            if (res === 1) {
                console.log('exists')
            } else {
                console.log('it doesnt exist')
            }
        }
    })
}
const redisGet = (key) => {
    keyExists(key)
    createRedisConnection().get(key, (err, reply) => {
        if (err) {
            throw err
        } else {
            console.log(reply)
        }
    })
}

module.exports = { createRedisConnection, redisGet, redisSet }
