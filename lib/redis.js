const redis = require("redis");
const redisClient = redis.createClient(process.env.REDISCLOUD_URL);

// Catches any error encountered while caching data.
module.exports = redisClient;