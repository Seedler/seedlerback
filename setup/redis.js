'use strict';

const config = require('seedler:config');
const redisConnector = require('seedler:libs/redisConnector');
const logger = config.getLogger('Redis launch');

module.exports = function(done) {
    logger.info('Try to init redis connector');

    redisConnector.createClient()
        .then(redis => {
            config.redis = redis;
            return redis.setAsync('test', {test: true})
        })
        .then(() => config.redis.getAsync('test'))
        .then(data => {
            logger.info(JSON.stringify(data, null, 2));

            if (data.init !== true) {
                throw new Error('Unexpected read/write operation');
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