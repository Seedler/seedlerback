'use strict';

const config = require('seedler:config');
const logger = config.getLogger('Router');
const controller = require('seedler:controller');
const express = require('express');
const router = express.Router();
const {
    app = {},
} = config;
const {
    routeHandler = (req, res, next) => next(),
} = controller;

module.exports = function() {
    logger.info(`Try to initialize api controller`);
    // Set express app use router
    app.use('/', router);

    // Other versions
    router.all(`/api/:version/:apiName/:action`, routeHandler);
    router.all(`/api/:version/:apiName/:type/:action`, routeHandler);
};