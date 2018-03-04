'use strict';

module.exports = function() {
    const validate = require('validate.js');
    const controller = require('../controller');
    const {
        API_CODES = {},
    } = controller;

    // Default codes
    validate.validators.exclusion.options = {code: API_CODES.RESERVED_WORD};
    validate.validators.length.options = {code: API_CODES.INVALID_LENGTH};
    validate.validators.format.options = {code: API_CODES.INVALID_SYMBOL};
    validate.validators.presence.options = {code: API_CODES.REQUIRED_INPUT};
    validate.validators.email.options = {code: API_CODES.NOT_EMAIL};

    validate.options = {format: 'custom'};
    validate.formatters.custom = errorList => {
        const result = {};

        for (let errorItem of errorList) {
            const {
                attribute,
                error,
                options = {},
            } = errorItem;
            const {
                code,
            } = options;

            console.log(`New error item: ${attribute}:`, errorItem);

            result[attribute] = {
                error,
                code,
            };
        }

        return result;
    };
};