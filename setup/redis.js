'use strict';

const config = require('seedler:config');
const redisConnector = require('seedler:libs/redisConnector');
const logger = config.getLogger('Redis launch');

module.exports = function(done) {
    logger.info('Try to init redis connector');

    redisConnector.createClient()
        .then(redis => config.redis = redis)
        .then(() => {
            logger.info('Redis connector launched!');
            done();
        })
        .catch(done)
    ;
};