'use strict';

const config = require('seedler:config');
const logger = config.getLogger('mongoConnector');
const isEqual = require('is-equal');
const MongoClient = require('mongodb').MongoClient;
let dbObject;

function getDataFromCursor(cursor) {
    const stream = cursor.stream();
    let result = [];

    return new Promise((resolve, reject) => {
        stream.on('data', doc => {
            result.push(doc);
        });
        stream.on('error', error => {
            reject(error);
        });
        stream.on('end', () => {
            stream.close();
            resolve(result);
        });
    });
}

const generateMatchObject = function(queryParams = {}, keyList = [], match = {}, negativeKeys = []) {
    keyList = Array.isArray(keyList) && keyList.length ? keyList : Object.keys(queryParams);

    for (let i = 0; i < keyList.length; i++) {
        let queryKey = keyList[i];
        let value = queryParams[queryKey];
        const isNegative = negativeKeys.includes(queryKey);

        if (Array.isArray(value)) {
            // Отфильтровываем специальное значение '-' - это значит, что параметр нужно проигнорировать
            value = value.filter(value => value !== '-');

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
        else if (value !== void 0) {
            if (isNegative) {
                match[queryKey] = {$ne: value};
            }
        }
    }

    return match;
};

module.exports = {
    connect() {
        if (dbObject) {
            return dbObject;
        }

        const {
            host,
            port,
            database,
            packageDescription,
        } = config;

        const url = `mongodb://${host}:${port}/${database}`;
        const options = {
            appname: packageDescription,
            autoReconnect: true,
            reconnectTries: 9999999999, // ~unlimited
            reconnectInterval: 5000,
            ignoreUndefined: true,
        };

        dbObject = MongoClient.connect(url, options);

        dbObject.on('connect', () => logger.info(`MongoDB connected successfully to ${url}`));
        dbObject.on('reconnect', () => logger.info(`MongoDB reconnected to ${url}`));

        return dbObject;
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
        } = collectionParams;

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
                const indexListToDelete = currentIndexList.filter(currentIndexItem => {
                    // Skip checking _id index
                    if (currentIndexItem.name === '_id_') {
                        return false;
                    }
                    return !indexes.find(indexItem => {
                        // Index item could be object with index keys or array with keys and options
                        // Convert to array
                        if (!Array.isArray(indexItem)) {
                            indexItem = [indexItem];
                        }
                        const [indexKeys = {}] = indexItem;

                        return isEqual(indexKeys, currentIndexItem.key)
                    })
                });

                let promise = Promise.resolve();
                for (let indexItem of indexListToDelete) {
                    promise = promise
                        .then(() => collection.dropIndex(indexItem.name))
                        .then(() => logger.info(`Drop index for ${collectionName} called ${indexItem.name}`))
                        .catch(err => logger.info(`Failed to drop index for ${collectionName} called ${indexItem.name}:`, err))
                    ;
                }

                // Create index
                for (let indexItem of indexes) {
                    // Index item could be object with index keys or array with keys and options
                    // Convert to array
                    if (!Array.isArray(indexItem)) {
                        indexItem = [indexItem];
                    }
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
                        .then(() => logger.info(`Create index on ${collectionName}: ${indexItem.name}`))
                        .catch(err => logger.info(`Failed to create index on ${collectionName}: ${indexItem.name}:`, err))
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
            returnNewDocuments,
        } = options;

        // Get the documents collection
        const collection = dbObject.collection(collectionName, {strict: true});
        let promise = collection.insertMany(docs);

        if (returnNewDocuments) {
            promise = promise.then(() => {
                const insertedIds = docs.map(doc => doc._id).filter(_id => _id);
                if (!insertedIds.length) {
                    return [];
                }

                const match = generateMatchObject({_id: insertedIds});

                return this.get(collectionName, {match});
            });
        }

        return promise;
    },

    get(collectionName, params = {}, options = {}) {
        const {
            match = {},
            sort,
            skip,
            limit,
        } = params;

        // Get the documents collection
        const collection = dbObject.collection(collectionName, {strict: true});
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

        return getDataFromCursor(cursor);
    },

    update(collectionName, params = {}, options = {}) {
        const {
            match = {},
            set = {},
            unset = {},
            multi = false,
        } = params;

        // Get the documents collection
        const collection = dbObject.collection(collectionName, {strict: true});
        const method = multi ? 'updateMany' : 'updateOne';

        return collection[method](match, {$set: set, $unset: unset}, options);
    },

    delete(collectionName, params = {}) {
        const {
            match = {},
            multi = false,
        } = params;

        // Get the documents collection
        const collection = dbObject.collection(collectionName, {strict: true});
        const method = multi ? 'deleteMany' : 'deleteOne';

        return collection[method](match);
    },

    generateMatchObject,
};