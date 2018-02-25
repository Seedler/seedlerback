'use strict';

const validate = require('validate.js');
const sha1 = require('sha1');
const cryptoRandomString = require('crypto-random-string');
const config = require('seedler:config');
const controller = require('seedler:controller');
const {
    db = {},
} = config;
const {

    API_CODES = {},
    STATUS_CODES = {},
} = controller;

const restrictedLoginList = [
    'root',
    'test',
    'admin',
    'administrator',
    'moderator',
    'support',
    'operator',
    'help',
    'techsupport',
];

const loginPattern = /\w+(\.(?=\w))?\w*/i;
const namePattern = /[a-z0-9\s]+/i;
const passwordPattern = /[a-z0-9\s.]+/i;

const keeperModel = {
    login: {
        format: {
            pattern: loginPattern,
            message: 'can only contain a-z and 0-9',
        },
        presence: {
            allowEmpty: false,
            message: 'is required',
        },
        length: {
            minimum: 4,
            maximum: 20,
            tooShort: 'needs to have %{count} symbols or more',
            tooLong: 'needs to have maximum %{count} symbols',
        },
        exclusion: restrictedLoginList,
    },
    name: {
        presence: {
            allowEmpty: false,
            message: 'is required',
        },
        format: {
            pattern: namePattern,
            message: 'can only contain a-z and 0-9 with white spaces',
        },
        length: {
            minimum: 4,
            maximum: 50,
            tooShort: 'needs to have %{count} symbols or more',
            tooLong: 'needs to have maximum %{count} symbols',
        }
    },
    email: {
        email: {
            message: 'Invalid email address',
        },
    },
    password: {
        format: {
            pattern: passwordPattern,
            message: 'can only contain A-z and 0-9 with white spaces and dots',
        },
        length: {
            minimum: 6,
            maximum: 32,
            tooShort: 'needs to have %{count} symbols or more',
            tooLong: 'needs to have maximum %{count} symbols',
        }
    },
};

module.exports = class Keeper {
    constructor(params = {}) {
        const validation = validate(params, keeperModel);
        if (validation) {
            controller.throwResponseError(STATUS_CODES.badRequest, API_CODES.invalidInput, JSON.stringify(validation));
        }

        const {
            login = '',
            name = '',
            email = '',
            password = '',
            passwordSalt = cryptoRandomString(5 + 5 * Math.random()),
        } = params;

        const {
            passwordHash = sha1(password + passwordSalt),
        } = params;

        const createdAt = new Date();

        return Object.assign(this, {
            login,
            name,
            email,

            passwordSalt,
            passwordHash,

            updatedAt: createdAt,
            createdAt,
        });
    }


};