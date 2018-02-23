'use strict';

const config = require('seedler:config');
const logger = config.getLogger('Router');
const controller = require('seedler:controller');
const express = require('express');
const router = express.Router();
const {
    app = {},
} = config;
const routeHandler = controller.routeHandler || ((req, res, next) => next());

module.exports = function() {
    logger.info(`Try to initialize api controller`);
    // Set express app use router
    app.use('/api', router);

    // Other versions
    router.all(`/:version/:apiName/:action`, routeHandler);
    router.all(`/:version/:apiName/:type/:action`, routeHandler);
};