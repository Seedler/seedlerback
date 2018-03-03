'use strict';

const validate = require('validate.js');
const sha1 = require('sha1');
const cryptoRandomString = require('crypto-random-string');

const controller = require('../controller');
const projectKeeper = require('../libs/projectKeeper');

const {
    db = {},
} = projectKeeper;

const {
    API_CODES = {},
    STATUS_CODES = {},
} = controller;
const collectionName = 'keepers';

const restrictedLoginList = [
    'root',
    'keeper',
    'user',
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
const passwordPattern = /[\w\s.,@$~#%&?*:;!^<>]+/i;

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
            message: 'is invalid',
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

class Keeper {
    constructor(params = {}) {
        // Use login as name if no name
        params.name = params.name || params.login;

        const validation = validate(params, keeperModel);
        if (validation) {
            controller.throwResponseError(STATUS_CODES.BAD_REQUEST, API_CODES.INVALID_INPUT, validation);
        }

        const {
            _id,
            login = '',
            name = '',
            email = '',
            password = '',
            passwordSalt = cryptoRandomString(5 + 5 * Math.random()),
            updatedAt = new Date(),
            createdAt = new Date(),
        } = params;

        const {
            passwordHash = Keeper.generateHash(password, passwordSalt),
        } = params;

        return Object.assign(this, {
            _id,
            login,
            name,
            email,

            passwordSalt,
            passwordHash,

            updatedAt,
            createdAt,
        });
    }

    static generateHash(password = '', salt = '') {
        return sha1(`${password}:${salt}`);
    }

    static getFromDB(params = {}) {
        // Use first key that is not undefined
        const match = db.generateMatchObject(params, [], {orKeys: ['_id', 'login', 'email']});
        return db.get(collectionName, {match})
            .then(resultList => {
                const [keeper] = resultList;
                if (!keeper) {
                    controller.throwResponseError(STATUS_CODES.NOT_FOUND, API_CODES.KEEPER_NOT_FOUND, `getKeeper: Keeper not found by params: ${JSON.stringify(params)}`);
                }

                return new Keeper(keeper);
            })
        ;
    }

    verifyPassword(password = '') {
        const {
            passwordSalt,
            passwordHash,
        } = this;

        const currentHash = Keeper.generateHash(password, passwordSalt);
        return  currentHash === passwordHash;
    }

    insertIntoDB() {
        const {
            _id,
        } = this;
        if (_id) {
            return this.update();
        }

        // autoincrement _id will be add to this by object-link
        return db.insert(collectionName, this, {autoIncrementId: true, returnNewDocuments: false})
            .then(() => this)
        ;
    }

    update() {
        const {
            _id,
        } = this;
        if (!_id) {
            controller.throwResponseError(STATUS_CODES.BAD_REQUEST, API_CODES.INVALID_INPUT, `updateKeeper: Passed keeper item should be set by setKeeper first (db id is not exists)`);
        }

        // Create new instance to update into db
        const preparedKeeper = new Keeper(this);
        // Mongo dislikes $set on _id key
        delete preparedKeeper._id;
        preparedKeeper.updatedAt = new Date();

        return db.update(collectionName, {_id}, {set: preparedKeeper}).then(() => this);
    }
}

module.exports = Keeper;