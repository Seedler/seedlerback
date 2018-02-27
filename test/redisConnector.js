'use strict';

const redisConnector = require('../libs/redisConnector');
// const logger = config.getLogger('MongoConnector');
const expect = require('expect.js');

let redis;
const testData = {
    testValue: true,
};

describe('Test redisConnector', () => {
    it('Test connection', () => {
        return redisConnector.createClient()
            .then(redisClient => {
                redis = redisClient;

                expect(redisClient).not.to.equal(null);
                expect(redisClient).to.be.an('object');
            })
            .catch(err => expect(err).to.be(null))
        ;
    });

    it('Test write operations', () => redis.setAsync('test', JSON.stringify(testData)));

    it('Test read operations', () => {
        return redis.getAsync('test')
            .then(data => {
                expect(data).to.be.a('string');

                const parsedData = JSON.parse(data);
                expect(parsedData).to.eql(testData);
            })
            .catch(err => expect(err).to.be(null))
        ;
    });

    it('Test delete operations', () => {
        return redis.delAsync('test')
            .then(() => redis.getAsync('test'))
            .then(data => expect(data).to.be(null))
            .catch(err => expect(err).to.be(null))
        ;
    });
});