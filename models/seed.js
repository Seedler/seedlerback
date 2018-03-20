'use strict';

module.exports = class Seed {
    constructor(params = {}) {
        const {

        } = params;

        const createdAt = new Date();

        return Object.assign(this, {

            updatedAt: createdAt,
            createdAt,
        });
    }
};