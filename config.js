'use strict';

const packageJSON = require('./package');
const Logger = require('log4js');
const logLevel = process.env.LOG_LEVEL || 'DEBUG';

module.exports = {
    logLevel,
    Logger,

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
};