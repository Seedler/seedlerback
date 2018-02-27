'use strict';

const projectKeeper = require('../../libs/projectKeeper');
const logger = projectKeeper.getLogger('api/v1/test');
const controller = require('../../controller');

const wrapMethod = controller.wrapMethod || (func => func);

logger.info(`Load api`);

module.exports = {
    run: wrapMethod(function run(params = {}) {
        return Object.assign({result: 'ok', user: params[controller.sAuthorizedUser]}, params);
    }),
    testApi(params = {}) {
        return Object.assign({result: 'started'}, params);
    },
};