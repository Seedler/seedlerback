'use strict';

const config = require('seedler:config');
const logger = config.getLogger('api/v1/keeper');
const controller = require('seedler:controller');
const {
    ACCESS_LEVELS = {},
} = controller;

const {
    mongodb: db = {},
} = config;

const wrapMethod = controller.wrapMethod || (func => func);

logger.info(`Load api`);

function getUsers(params = {}) {
    return db.get();
}

module.exports = {
    accessLevel: ACCESS_LEVELS.support,
    readMany: wrapMethod(getUsers)
};