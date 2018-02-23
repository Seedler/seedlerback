'use strict';

const config = require('seedler:config');
const logger = config.getLogger('api/v1/test');
const controller = require('seedler:controller');

const wrapMethod = controller.wrapMethod || (func => func);

logger.info(`Load api`);

module.exports = {
    run: wrapMethod(function run(params = {}) {
        return Object.assign({result: 'ok', user: params[controller.sAuthorizedUser]}, params);
    }),
    testApi(params = {}) {
        return Object.assign({result: 'started'}, params);
    }
};