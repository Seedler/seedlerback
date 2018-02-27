'use strict';

const projectKeeper = require('../../libs/projectKeeper');
const logger = projectKeeper.getLogger('api/v1/keeper');
const controller = require('../../controller');
const {
    ACCESS_LEVELS = {},
} = controller;

const {
    db = {},
} = projectKeeper;

const wrapMethod = controller.wrapMethod || (func => func);

logger.info(`Load api`);

function getUsers(params = {}) {
    return db.get();
}

module.exports = {
    accessLevel: ACCESS_LEVELS.support,
    readMany: wrapMethod(getUsers)
};