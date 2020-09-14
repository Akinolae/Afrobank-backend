const redis = require("redis");
const redisClient = redis.createClient(6379);

// Catches any error encountered while caching data.
module.exports = redisClient;