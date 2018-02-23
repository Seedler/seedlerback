'use strict';

const config = require('seedler:config');
const redisConnector = require('seedler:libs/redisConnector');
const logger = config.getLogger('Redis launch');

module.exports = function(done) {
    logger.info('Try to init redis connector');

    redisConnector.createClient()
        .then(redis => {
            config.redis = redis;
            return redis.setAsync('test', JSON.stringify({initialized: true}))
        })
        .then(() => config.redis.getAsync('test'))
        .then(data => {
            const parsedData = JSON.parse(data);

            if (parsedData.initialized !== true) {
                throw new Error(`Error during initial read/write operation: ${data}`);
            }
        })
        .then(() => config.redis.delAsync('test'))
        .then(() => {
            logger.info('Redis connector launched!');
            done();
        })
        .catch(done)
    ;
};