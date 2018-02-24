'use strict';

module.exports = class Tenure {
    constructor(params = {}) {
        const {
            forestId,
            userId,
            accessLevel,
        } = params;

        const createdAt = new Date();

        return Object.assign(this, {
            forestId,
            userId,
            accessLevel,
            updatedAt: createdAt,
            createdAt,
        });
    }
};