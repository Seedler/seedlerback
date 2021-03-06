'use strict';

const projectKeeper = require('../libs/projectKeeper');
const config = require('../config');
const logger = projectKeeper.getLogger('mongoConnector');
const isEqual = require('is-equal');
const MongoClient = require('mongodb').MongoClient;

let dbObject;
let dbClient;

function getNextId(collectionName, count = 0) {
    if (!count) {
        return Promise.resolve(count);
    }

    return dbObject
        .collection('dbCounters')
        .findOneAndUpdate({_id: collectionName}, {$setOnInsert: {_id: collectionName}, $inc: {lastId: count}}, {upsert: true})
        .then(result => {
            // Returns null on insert (first upsert on document)
            const value = result.value || {};
            // Returns actual lastId (before the update)
            const lastId = value.lastId || 0;
            // Next id starts with +1
            return lastId + 1;
        })
    ;
}

function getCollection(collectionName = '', params = {}) {
    return new Promise((resolve, reject) => {
        dbObject.collection(collectionName, params, (err, collection) => {
            if (err) {
                return reject(err);
            }

            return resolve(collection);
        });
    });
}

function generateMatchObject(queryParams = {}, keyList = [], options = {}) {
    let {
        match = {},
        negativeKeys = [],
        orKeys = [],
        strict = true,
    } = options;

    const globalMatch = match;

    if (!Array.isArray(keyList) || !keyList.length) {
        if (orKeys.length) {
            // Use first key that is not undefined
            keyList = orKeys;
        }
        else if (negativeKeys.length) {
            keyList = negativeKeys;
        }
        else {
            keyList = Object.keys(queryParams);
        }
    }

    for (let i = 0; i < keyList.length; i++) {
        const queryKey = keyList[i];
        const value = queryParams[queryKey];
        // Skip undefined values
        const keyHasValue = value !== void 0;
        if (!keyHasValue) {
            continue;
        }

        const isNegative = negativeKeys.length && negativeKeys.includes(queryKey);
        const isOr = orKeys.length && orKeys.includes(queryKey);
        if (isOr) {
            let orList = globalMatch.$or;
            if (!orList) {
                orList = globalMatch.$or = [];
            }
            orList.push(match = {});
        }
        else {
            match = globalMatch;
        }

        if (Array.isArray(value)) {
            if (value.length === 1) {
                if (isNegative) {
                    match[queryKey] = {$ne: value[0]};
                }
                else {
                    match[queryKey] = value[0];
                }
            }
            else if (value.length) {
                if (isNegative) {
                    match[queryKey] = {$nin: value};
                }
                else {
                    match[queryKey] = {$in: value};
                }
            }

        }
        else if (isNegative) {
            match[queryKey] = {$ne: value};
        }
        else {
            match[queryKey] = value;
        }
    }
    // Throw error if match has no params
    if (strict && !Object.keys(globalMatch).length) {
        throw new Error(`Query params should have more keys of possible list: ${keyList}`);
    }

    return globalMatch;
}

function normalizeIndexItem(indexItem = {}) {
    // Index item could be object with index keys or array with keys and options
    // Convert to array
    if (!Array.isArray(indexItem)) {
        indexItem = [indexItem];
    }

    return indexItem;
}

module.exports = {
    connect() {
        if (dbObject) {
            return dbObject;
        }

        const {
            mongodb = {},
            packageDescription,
        } = config;

        const {
            host,
            port,
            database,
        } = mongodb;

        const url = `mongodb://${host}:${port}`;
        const options = {
            appname: packageDescription,
            autoReconnect: true,
            reconnectTries: 9999999999, // ~unlimited
            reconnectInterval: 5000,
            ignoreUndefined: true,
        };

        logger.info(`Try to connect to MongoDB using url: ${url}`);
        return MongoClient.connect(url, options)
            .then(client => {
                dbClient = client;
                const db = client.db(database);

                dbObject = db;

                client.on('reconnect', () => logger.info(`MongoDB reconnected to ${url}`));

                return db;
            })
        ;
    },

    checkCollections(collectionList = []) {
        if (!collectionList.length) {
            const {
                mongodb = {},
            } = config;
            const {
                collections = [],
            } = mongodb;

            collectionList = collections;
        }

        let promise = Promise.resolve();
        for (let collectionParams of collectionList) {
            promise = promise.then(() => this.checkCollection(collectionParams));
        }

        return promise;
    },

    checkCollection(collectionParams = {}) {
        const {
            name: collectionName,
            indexes = [],
            options = {},
            disableIndexId = false,
        } = collectionParams;

        // Every collection will have "id" index
        const normalizedIndexList = indexes.map(normalizeIndexItem);
        if (!disableIndexId) {
            const idIndex = [{id: 1}, {unique: 1}];
            const existedIdIndexKey = normalizedIndexList.find(indexItem => isEqual(indexItem[0], idIndex[0]));
            if (!existedIdIndexKey) {
                normalizedIndexList.push(idIndex);
            }
        }

        let collection;
        // Create collection at first
        return dbObject.createCollection(collectionName, options)
            // Get collection indexes to sync
            .then(createdCollection => {
                collection = createdCollection;
                return createdCollection.listIndexes().toArray();
            })
            // Remove deprecated indexes first
            .then(currentIndexList => {
                const currentIndexListToDelete = currentIndexList.filter(currentIndexItem => {
                    // Skip checking _id index
                    if (currentIndexItem.name === '_id_') {
                        return false;
                    }
                    return !normalizedIndexList.find(indexItem => {
                        const [indexKeys = {}] = indexItem;
                        return isEqual(indexKeys, currentIndexItem.key)
                    })
                });

                let promise = Promise.resolve();
                for (let currentIndexItem of currentIndexListToDelete) {
                    promise = promise
                        .then(() => collection.dropIndex(currentIndexItem.name))
                        .then(() => logger.info(`Drop index for ${collectionName} called ${currentIndexItem.name}`))
                        .catch(err => logger.info(`Failed to drop index for ${collectionName} called ${currentIndexItem.name}:`, err))
                    ;
                }

                // Create index
                for (let indexItem of normalizedIndexList) {
                    const [
                        indexKeys = {},
                        options = {},
                    ] = indexItem;

                    // No need to create existed index
                    if (currentIndexList.find(currentIndexItem => isEqual(currentIndexItem.key, indexKeys))) {
                        continue;
                    }

                    promise = promise
                        .then(() => collection.createIndex(indexKeys, options))
                        .then(() => logger.info(`Create index on ${collectionName}: `, indexKeys))
                        .catch(err => logger.info(`Failed to create index on ${collectionName}: `, indexKeys, err))
                    ;
                }

                return promise;
            })
        ;
    },

    insert(collectionName, docs, options = {}) {
        if (!docs || typeof docs !== 'object') {
            return Promise.resolve();
        }
        if (!Array.isArray(docs)) {
            docs = [docs];
        }

        const {
            autoIncrementId = true,
            returnNewDocuments = false,
        } = options;

        let promise = Promise.resolve();

        if (autoIncrementId) {
            const idCountToReserve = docs.length;

            promise = promise
                .then(() => getNextId(collectionName, idCountToReserve))
                .then(nextId => {
                    for (let i = 0; i < idCountToReserve; i++) {
                        const doc = docs[i];
                        doc._id = nextId;
                        doc.id = nextId++;
                    }
                })
            ;
        }

        // Get the documents collection
        return promise
            .then(() => getCollection(collectionName, {strict: true}))
            .then(collection => collection.insertMany(docs))
            .then(result => {
                if (returnNewDocuments) {
                    const insertedIds = docs.map(doc => doc._id).filter(_id => _id);
                    if (!insertedIds.length) {
                        return [];
                    }

                    const match = generateMatchObject({_id: insertedIds});

                    return this.get(collectionName, {match});
                }

                return result;
            })
        ;
    },

    get(collectionName, params = {}, options = {}) {
        const {
            match = {},
            sort,
            skip,
            limit,
        } = params;

        // Get the documents collection
        return getCollection(collectionName, {strict: true})
            .then(collection => {
                let cursor = collection.find(match, options);

                if (sort) {
                    cursor = cursor.sort(sort);
                }
                if (skip) {
                    cursor = cursor.skip(skip);
                }
                if (limit) {
                    cursor = cursor.limit(limit);
                }

                return cursor.toArray();
            })
        ;
    },

    update(collectionName, match = {}, options = {}) {
        const {
            set = {},
            unset = {},
            multi = false,
        } = options;

        const updateObject = {};
        if (Object.keys(set).length) {
            updateObject.$set = set;
        }
        if (Object.keys(unset).length) {
            updateObject.$unset = unset;
        }

        // Get the documents collection
        return getCollection(collectionName, {strict: true})
            .then(collection => {
                const method = multi ? 'updateMany' : 'updateOne';
                return collection[method](match, updateObject, options);
            })
        ;
    },

    delete(collectionName, match = {}, options = {}) {
        const {
            multi = false,
        } = options;

        // Get the documents collection
        return getCollection(collectionName, {strict: true})
            .then(collection => {
                const method = multi ? 'deleteMany' : 'deleteOne';
                return collection[method](match);
            })
        ;
    },

    generateMatchObject,

    closeConnection(force = false) {
        return dbClient.close(force);
    }
};