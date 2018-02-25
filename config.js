'use strict';

const packageJSON = require('./package');
const Logger = require('log4js');
const logLevel = process.env.LOG_LEVEL || 'DEBUG';

module.exports = {
    logLevel,
    Logger,

    linkGlobalPaths() {
        // Special module to simplify factory-modules requiring (add own ids replacing paths)
        const requireLinker = require('./libs/requireLinker');
        // Use require('seedler:config') from everywhere
        requireLinker.link('seedler', './config');
        requireLinker.link('seedler', './controller');
        requireLinker.link('seedler', './api');
        // Use require('seedler:libs/libraryName') from everywhere
        requireLinker.link('seedler', './libs');
        requireLinker.link('seedler', './models');
    },

    getLogger(env, lvl) {
        const logger = Logger.getLogger(env || 'app');
        logger.setLevel(lvl || logLevel);

        return logger;
    },

    rootDir: __dirname,
    packageDescription: `${packageJSON.name}#${packageJSON.version}`,

    server: {
        port: process.env.PORT || 3000,
    },
    mongodb: {
        host: process.env.MONGODB_HOST || '127.0.0.1',
        port: process.env.MONGODB_PORT || 27017,
        database: process.env.MONGODB_DATABASE || 'seedler',
        collections: [
            {
                name: 'keepers',
                indexes: [
                    {login: 1},
                    {email: 1},
                ],
            },
            {
                name: 'forests',
            },
            {
                name: 'tenures',
                indexes: [
                    {keeperId: 1},
                    {forestId: 1},
                    {keeperId: 1, forestId: 1},
                ],
            },
        ],
    }
};