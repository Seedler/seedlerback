'use strict';

const validate = require('validate.js');
const sha1 = require('sha1');
const cryptoRandomString = require('crypto-random-string');
const config = require('seedler:config');
const {
    db = {},
} = config;

module.exports = class Keeper {
    constructor(params = {}) {
        const {
            login = '',
            name = '',
            email = '',
            password = '',
        } = params;

        const passwordSalt = cryptoRandomString(5 + 5 * Math.random());
        const passwordHash = sha1(password + passwordSalt);

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