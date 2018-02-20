'use strict';

const config = require('seedler:config');
const logger = config.getLogger('Mongo connection initialization');

module.exports = function() {
    logger.info(`Try to initialize mongoConnector`);
};