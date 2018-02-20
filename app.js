'use strict';

// Special module to simplify factory-modules requiring (add own ids replacing paths)
const requireLinker = require('./libs/requireLinker');
// Use require('seedler:config') from everywhere
requireLinker.link('seedler', './config');
requireLinker.link('seedler', './package');
// Use require('seedler:libs/libraryName') from everywhere
requireLinker.link('seedler', './libs');

const config = require('seedler:config');
const launch = require('seedler:libs/launch');
const logger = config.getLogger('WebServer');

// Express Router and middleware
const express = require('express');
const app = launch(express());
const router = express.Router();

Object.assign(config, {
    app,
    router,
});

app
    .stage('./setup/mongodb')
    // .stage('./setup/redis')
    .stage('./setup/expressMiddleware')
    .stage('./setup/controller')
    .run
    .then(() => {
        const {
            port = 8080,
        } = config.server;

        logger.info(`App now listen on port ${port}...`);
        app.listen(port);

        logger.info('Seedler instance started!');
    })
    .catch(err => logger.error(err))
;

