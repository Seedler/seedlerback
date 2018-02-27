'use strict';

module.exports = function() {
    const projectKeeper = require('../libs/projectKeeper');
    const logger = projectKeeper.getLogger('Router');
    logger.info(`Try to initialize api controller`);

    const controller = require('../controller');
    const express = require('express');
    const router = express.Router();
    const {
        app = {},
    } = projectKeeper;

    // Set express app use router
    app.use('/api', router);

    const routeHandler = controller.routeHandler || ((req, res, next) => next());
    // Other versions
    router.all(`/:version/:apiName/:action`, routeHandler);
    router.all(`/:version/:apiName/:type/:action`, routeHandler);
};