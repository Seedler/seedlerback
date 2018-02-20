'use strict';

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

    server: {
        port: process.env.PORT || 3000,
    },
};