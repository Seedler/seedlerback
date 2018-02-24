'use strict';

module.exports = class Variety {
    constructor(params = {}) {
        const {
            typeId = 0,
            name = '',
            color,
        } = params;

        const createdAt = new Date();

        return Object.assign(this, {
            typeId,
            name,
            color,

            updatedAt: createdAt,
            createdAt,
        });
    }
};