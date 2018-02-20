'use strict';

const config = require('seedler:config');
const logger = config.getLogger('Express middleware initialization');

module.exports = function() {
    logger.info(`Try to add middleware modules to express app`);

    const {
        app = {},
    } = config;

    const cors = require('cors');
    const bodyParser = require('body-parser');

    app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
        extended: true,
        parameterLimit: 10000,
        limit: 1024 * 1024 * 10,
    }));

    app.use(bodyParser.json({
        parameterLimit: 10000,
        limit: 1024 * 1024 * 10,
    }));

    app.use(cors(function(origin, callback) {
        callback(null, {
            origin: true,
            credentials: true,
        });
    }));

    app.options('*', cors(function(origin, callback) {
        callback(null, {
            origin: true,
            credentials: true,
        });
    }));
};