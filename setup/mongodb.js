'use strict';

module.exports = function() {
    const projectKeeper = require('../libs/projectKeeper');
    const logger = projectKeeper.getLogger('MongoConnector');
    logger.info(`Try to initialize mongoConnector`);

    const mongoConnector = require('../libs/mongoConnector');
    return mongoConnector
        .connect()
        .then(client => {
            return mongoConnector.checkCollections()
                .then(() => ({
                    mongoClient: client,
                    db: mongoConnector,
                }))
            ;
        })
    ;
};