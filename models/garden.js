'use strict';

const validate = require('validate.js');
const controller = require('../controller');
const projectKeeper = require('../libs/projectKeeper');

const {
    db = {},
} = projectKeeper;

const {
    ACCESS_LEVELS = {},
    API_CODES = {},
    STATUS_CODES = {},
} = controller;

const safeKeyList = [
    'id',
    'name',
    'ownerId',
    'accessLevel',
    'updatedAt',
    'createdAt',
];

const collectionName = 'forests';
const namePattern = /[a-z0-9\s]+/i;
const forestModel = {
    name: {
        presence: {
            allowEmpty: false,
            message: 'is required',
            code: API_CODES.REQUIRED_INPUT,
        },
        format: {
            pattern: namePattern,
            message: 'can only contain a-z and 0-9 with white spaces',
            code: API_CODES.INVALID_SYMBOL,
        },
        length: {
            minimum: 4,
            maximum: 50,
            tooShort: 'needs to have %{count} symbols or more',
            tooLong: 'needs to have maximum %{count} symbols',
            code: API_CODES.INVALID_LENGTH,
        }
    },
    ownerId: {
        presence: {
            allowEmpty: false,
            message: 'is required',
            code: API_CODES.REQUIRED_INPUT,
        },
    },
};

class Garden {
    constructor(params = {}) {
        const validation = validate(params, forestModel);
        if (validation) {
            controller.throwResponseError(STATUS_CODES.BAD_REQUEST, API_CODES.INVALID_INPUT, validation);
        }

        const {
            id,
            name = '',
            accessLevel = ACCESS_LEVELS.LANDOWNER,
            ownerId,

            updatedAt = new Date(),
            createdAt = new Date(),
        } = params;

        return Object.assign(this, {
            id,
            name,
            accessLevel,

            ownerId,
            updatedAt,
            createdAt,
        });
    }

    static getManyFromDB(params = {}) {
        const match = db.generateMatchObject(params, ['id', 'ownerId']);
        return db.get(collectionName, {match})
            .then(resultList => {
                // if (!resultList.length) {
                //     controller.throwResponseError(STATUS_CODES.NOT_FOUND, API_CODES.FOREST_NOT_FOUND, `getKeeper: Garden not found by params: ${JSON.stringify(params)}`);
                // }

                return resultList.map(garden => new Garden(garden));
            })
        ;
    }

    static getFromDB(params = {}) {
        return Garden.getManyFromDB(params)
            .then(resultList => {
                const [garden] = resultList;
                if (!garden) {
                    controller.throwResponseError(STATUS_CODES.NOT_FOUND, API_CODES.FOREST_NOT_FOUND, `getFromDB: Garden not found by params: ${JSON.stringify(params)}`);
                }

                return garden;
            })
        ;
    }

    get safeData() {
        return controller.cloneByWhiteKeyList(this, safeKeyList);
    }

    insertIntoDB() {
        const {
            id,
        } = this;
        if (id) {
            return this.updateIntoDB();
        }

        // autoincrement id will be add to this by object-link
        return db.insert(collectionName, this, {autoIncrementId: true, returnNewDocuments: false})
            .then(() => this)
        ;
    }

    updateIntoDB() {
        const {
            id,
        } = this;
        if (!id) {
            controller.throwResponseError(STATUS_CODES.BAD_REQUEST, API_CODES.INVALID_INPUT, `updateIntoDB: Passed garden item should be set by insertIntoDB first (db id is not exists)`);
        }

        // Create new instance to update into db
        const preparedItem = new Garden(this);
        preparedItem.updatedAt = new Date();

        return db.update(collectionName, {id}, {set: preparedItem}).then(() => this);
    }
}

module.exports = Garden;