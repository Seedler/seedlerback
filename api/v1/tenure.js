'use strict';

const controller = require('../../controller');
const {
    API_CODES = {},
    STATUS_CODES = {},
    ACCESS_LEVELS = {},
    wrapMethod = func => func,
    extractUserFromParams = func => func,
    throwResponseError = func => func,
} = controller;

const Tenure = require('../../models/tenure');

async function createTenure(params = {}) {
    // Only moderators and upper can tenure somebody
    await Tenure.checkTenantAccess(params, ACCESS_LEVELS.MODERATOR);

    const {
        keeperId,
        gardenId,
        accessLevel,
    } = params;

    const validAccessLevel = accessLevel > ACCESS_LEVELS.POACHER && accessLevel < ACCESS_LEVELS.LANDOWNER;
    if (!validAccessLevel) {
        throwResponseError(STATUS_CODES.BAD_REQUEST, API_CODES.INVALID_ACCESS_LEVEL, 'You shall not tenure keeper as a landowner');
    }

    const existedTenure = await Tenure.getFromDB({keeperId, gardenId});
    if (existedTenure) {
        throwResponseError(STATUS_CODES.BAD_REQUEST, API_CODES.TENURE_ALREADY_EXISTS, 'Tenure for this keeper already exists');
    }

    return new Tenure(params).insertIntoDB();
}

function getTenures(params = {}) {
    const {
        id: keeperId,
    } = extractUserFromParams(params);

    return Tenure.getManyFromDB({keeperId});
}

async function updateTenure(params = {}) {
    // Only moderators and upper can change tenure
    await Tenure.checkTenantAccess(params, ACCESS_LEVELS.MODERATOR);
    const {
        accessLevel,
        keeperId,
        gardenId,
    } = params;

    if (typeof keeperId !== 'number') {
        controller.throwResponseError(STATUS_CODES.BAD_REQUEST, API_CODES.INVALID_ID, 'Type of keeperId should be a number');
    }

    const validAccessLevel = accessLevel < ACCESS_LEVELS.LANDOWNER;
    if (!validAccessLevel) {
        throwResponseError(STATUS_CODES.BAD_REQUEST, API_CODES.INVALID_ACCESS_LEVEL, 'You shall not tenure keeper as a landowner');
    }

    const tenure = await Tenure.getFromDB({keeperId, gardenId});
    if (tenure.accessLevel === ACCESS_LEVELS.LANDOWNER) {
        throwResponseError(STATUS_CODES.BAD_REQUEST, API_CODES.TENURE_ACCESS_DENIED, 'You could only transfer ownership or delete garden');
    }

    // Only could change value of accessLevel
    tenure.accessLevel = accessLevel;

    return tenure.updateIntoDB();
}

async function removeTenure(params = {}) {
    // Only moderators and upper can make somebody untenured
    await Tenure.checkTenantAccess(params, ACCESS_LEVELS.MODERATOR);
    const {
        keeperId,
        gardenId,
    } = params;

    if (typeof keeperId !== 'number') {
        controller.throwResponseError(STATUS_CODES.BAD_REQUEST, API_CODES.INVALID_ID, 'Type of keeperId should be a number');
    }

    const tenure = await Tenure.getFromDB({keeperId, gardenId});
    if (tenure.accessLevel === ACCESS_LEVELS.LANDOWNER) {
        throwResponseError(STATUS_CODES.BAD_REQUEST, API_CODES.TENURE_ACCESS_DENIED, 'You could only transfer ownership or delete garden');
    }

    return tenure.deleteFromDB();
}

module.exports = {
    accessLevel: ACCESS_LEVELS.KEEPER,
    create: wrapMethod(createTenure),
    list: wrapMethod(getTenures),
    update: wrapMethod(updateTenure),
    delete: wrapMethod(removeTenure),
};