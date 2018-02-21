'use strict';

const config = require('seedler:config');
const logger = config.getLogger('test api');

module.exports = {
    run(params = {}) {
        return Object.assign({result: 'ok'}, params);
    },
    testApi(params = {}) {
        return Object.assign({result: 'started'}, params);
    }
};