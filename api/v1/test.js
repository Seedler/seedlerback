'use strict';

const config = require('seedler:config');
const logger = config.getLogger('test api');
const controller = require('seedler:controller');

const {
    wrapMethod = func => func,
    PERMISSION_LEVELS = {},
} = controller;

module.exports = {
    run: wrapMethod(function run(params = {}) {
        return Object.assign({result: 'ok', user: params[controller.sAuthorizedUser]}, params);
    }),
    testApi(params = {}) {
        return Object.assign({result: 'started'}, params);
    }
};