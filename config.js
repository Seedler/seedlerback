'use strict';

const packageJSON = require('./package');

module.exports = {
    rootDir: __dirname,
    packageDescription: `${packageJSON.name}#${packageJSON.version}`,

    server: {
        port: process.env.PORT || 3000,
    },
    redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379,
    },
    mongodb: {
        host: process.env.MONGODB_HOST || '127.0.0.1',
        port: process.env.MONGODB_PORT || 27017,
        database: process.env.MONGODB_DATABASE || 'seedler',
        collections: [
            {
                name: 'keepers',
                indexes: [
                    {login: 1},
                    {email: 1},
                ],
            },
            {
                name: 'forests',
            },
            {
                name: 'tenures',
                indexes: [
                    {keeperId: 1},
                    {forestId: 1},
                    {keeperId: 1, forestId: 1},
                ],
            },
        ],
    }
};