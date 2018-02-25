'use strict';

const config = require('seedler:config');
const logger = config.getLogger('MongoConnector');
const mongoConnector = require('seedler:libs/mongoConnector');

module.exports = function() {
    logger.info(`Try to initialize mongoConnector`);

    return mongoConnector
        .connect()
        .then(db => {
            config.mongoObject = db;
            config.db = mongoConnector;

            logger.info(`mongoConnector initialized, mongoObject added to config closure`);

            return mongoConnector.checkCollections();
        })
        .then(() => logger.info(`Collections and indexes checked`))
    ;
};