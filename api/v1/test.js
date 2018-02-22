'use strict';

const config = require('seedler:config');
const logger = config.getLogger('test api');
const controller = require('seedler:controller');

module.exports = {
    run(params = {}) {
        return Object.assign({result: 'ok', user: params[controller.sAuthorizedUser]}, params);
    },
    testApi(params = {}) {
        return Object.assign({result: 'started'}, params);
    }
};