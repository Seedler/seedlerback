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
    'gardenId',
    'keeperId',
    'accessLevel',
    'updatedAt',
    'createdAt',
];

const collectionName = 'tenures';
const tenureModel = {
    gardenId: {
        presence: {
            allowEmpty: false,
            message: 'is required',
            code: API_CODES.REQUIRED_INPUT,
        },
    },
    keeperId: {
        presence: {
            allowEmpty: false,
            message: 'is required',
            code: API_CODES.REQUIRED_INPUT,
        },
    },
};

class Tenure {
    constructor(params = {}) {
        const validation = validate(params, tenureModel);
        if (validation) {
            controller.throwResponseError(STATUS_CODES.BAD_REQUEST, API_CODES.INVALID_INPUT, validation);
        }

        const {
            id,
            gardenId,
            keeperId,
            accessLevel = ACCESS_LEVELS.POACHER,
            updatedAt = new Date(),
            createdAt = new Date(),
        } = params;

        return Object.assign(this, {
            id,
            gardenId,
            keeperId,
            accessLevel,

            updatedAt,
            createdAt,
        });
    }

    static getManyFromDB(params = {}) {
        const match = db.generateMatchObject(params, ['id', 'gardenId', 'keeperId']);
        return db.get(collectionName, {match})
            .then(resultList => {
                return resultList.map(tenure => new Tenure(tenure));
            })
        ;
    }

    static getFromDB(params = {}) {
        return Tenure.getManyFromDB(params)
            .then(resultList => {
                const [tenure] = resultList;
                // if (!tenure) {
                //     controller.throwResponseError(STATUS_CODES.NOT_FOUND, API_CODES.TENURE_NOT_FOUND, `getFromDB: Tenure not found by params: ${JSON.stringify(params)}`);
                // }

                return tenure;
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
            controller.throwResponseError(STATUS_CODES.BAD_REQUEST, API_CODES.INVALID_INPUT, `updateIntoDB: Passed tenure item should be set by insertIntoDB first (db id is not exists)`);
        }

        // Create new instance to update into db
        const preparedItem = new Tenure(this);
        preparedItem.updatedAt = new Date();

        return db.update(collectionName, {id}, {set: preparedItem}).then(() => this);
    }
}

module.exports = Tenure;