'use strict';

module.exports = function() {
    const projectKeeper = require('../libs/projectKeeper');
    const logger = projectKeeper.getLogger('Express middleware initialization');
    logger.info(`Try to add middleware modules to express app`);

    const cors = require('cors');
    const bodyParser = require('body-parser');
    // Add framework
    const express = require('express');
    // Special middleware to add setup-stages
    const app = express();

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

    // All returned in objects will be assigned to projectKeeper object
    return {
        app,
    };
};