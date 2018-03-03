const redis = require('redis');
const config = require('./../config');

promisify(redis.RedisClient.prototype);
promisify(redis.Multi.prototype);

function promisify(prototype) {
    const protoList = Object.getOwnPropertyNames(prototype);

    for (let property of protoList) {

        let method;
        try {
            method = prototype[property];
        }
        catch (err) {
            continue;
        }

        if (typeof method !== 'function') {
            continue;
        }

        prototype[property + 'Async'] = makePromiseFunction(method);
    }
}

function makePromiseFunction(func) {
    return function() {
        const that = this;
        return new Promise((resolve, reject) => {
            func.call(that, ...arguments, (err, result) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            })
        });
    }
}

function createClient(options = config.redis) {
    return new Promise((resolve, reject) => {
        const cache = redis.createClient(options);

        cache.on('ready', () => resolve(cache));
        cache.on('error', err => reject(err));
    });
}

module.exports = {
    createClient,
};
