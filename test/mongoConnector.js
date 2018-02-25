'use strict';

const config = require('../config');
const mongoConnector = require('seedler:libs/mongoConnector');
// const logger = config.getLogger('MongoConnector');
const expect = require('expect.js');

const startTimestamp = Date.now();
const collectionName = 'test';
const testField = `value${startTimestamp}`;
const testDoc = {
    _id: startTimestamp,
    [testField]: 1,
};

let promise = Promise.resolve();

describe('mongodbConnector connection and routines', () => {
    it('Test mongodb connection', () => {
        promise = promise
            .then(() => mongoConnector.connect())
            .then(db => {
                expect(db).not.to.equal(null);
                expect(db).to.be.an('object');
            })
        ;

        return promise;
    });

    it('Test index normalization', () => {
        promise = promise.then(() => mongoConnector.checkCollection({
            name: collectionName,
            indexes: [
                {[testField]: 1},
            ],
        }));

        return promise;
    });

    // Remove all from collection
    it('Flush collection', () => {
        promise = promise.then(() => mongoConnector.delete(collectionName, {multi: true}));

        return promise;
    });

    it('Test insert document', () => {
        promise = promise.then(() => mongoConnector.insert(collectionName, testDoc));
        return promise.catch(err => expect(err).to.be(null));
    });

    it('Test update document', () => {
        const changeItem = {
            [testField]: startTimestamp,
        };
        Object.assign(testDoc, changeItem);

        const match = mongoConnector.generateMatchObject({_id: testDoc._id});
        promise = promise.then(() => mongoConnector.update(collectionName, {match, set: changeItem}));
        return promise.catch(err => expect(err).to.be(null));
    });

    it('Test get document', () => {
        const match = mongoConnector.generateMatchObject({_id: testDoc._id});
        promise = promise
            .then(() => mongoConnector.get(collectionName, {match}))
            .then(itemList => {
                const docFromDB = itemList.shift();
                expect(docFromDB).to.eql(testDoc);
            })
        ;
        return promise.catch(err => expect(err).to.be(null));
    });

    it('Test delete document', () => {
        const match = mongoConnector.generateMatchObject({_id: testDoc._id});
        promise = promise
            .then(() => mongoConnector.delete(collectionName, {match}))
        ;
        return promise.catch(err => expect(err).to.be(null));
    });

    it('Close connection and exit process', () => {
        return promise
            .then(() => mongoConnector.closeConnection(true))
        ;
    });
});