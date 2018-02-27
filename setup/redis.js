'use strict';

module.exports = function() {
    const projectKeeper = require('../libs/projectKeeper');
    const logger = projectKeeper.getLogger('Redis launch');
    logger.info('Try to init redis connector');

    const redisConnector = require('../libs/redisConnector');
    return redisConnector.createClient()
        .then(redis => ({redis}))
    ;
};