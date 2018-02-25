'use strict';

const config = require('./config');
const launch = require('seedler:libs/launch');
const logger = config.getLogger('WebServer');

// Express Router and middleware
const express = require('express');
// Special middleware to add setup-stages
const app = config.app = launch(express());

app
    .stage('./setup/mongodb')
    .stage('./setup/redis')
    .stage('./setup/express')
    .stage('./setup/passport')
    .stage('./setup/router')
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

