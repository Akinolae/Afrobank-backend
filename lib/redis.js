const redis = require("redis");
const url = require('url');
// const RDB = url.parse(process.env.REDISCLOUD_URL);
// const sequelizeOptions = process.env.NODE_ENV === 'production' ? RDB : 6379;
// const redisClient = redis.createClient(sequelizeOptions);
let redisClient;
if (process.env.REDISCLOUD_URL) {
    const redisURL = url.parse(process.env.REDISCLOUD_URL);
    redisClient = redis.createClient(redisURL.port, redisURL.hostname, {
        no_ready_check: true
    })
} else {
    redisClient = redis.createClient()
}

// Catches any error encountered while caching data.
module.exports = redisClient;


