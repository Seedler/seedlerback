'use strict';

const sha1 = require('sha1');
const cryptoRandomString = require('crypto-random-string');

module.exports = class Keeper {
    constructor(params = {}) {
        const {
            username = '',
            name = '',
            email = '',
            password = '',
        } = params;

        const passwordSalt = cryptoRandomString(5 + 5 * Math.random());
        const passwordHash = sha1(password + passwordSalt);

        const createdAt = new Date();

        return Object.assign(this, {
            username,
            name,
            email,

            passwordSalt,
            passwordHash,

            updatedAt: createdAt,
            createdAt,
        });
    }
};