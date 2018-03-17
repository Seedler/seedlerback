'use strict';

// const projectKeeper = require('../../libs/projectKeeper');
// const logger = projectKeeper.getLogger('api/v1/garden');
const controller = require('../../controller');
const {
    API_CODES = {},
    STATUS_CODES = {},
    ACCESS_LEVELS = {},
    wrapMethod = func => func,
    extractUserFromParams = func => func,
    throwResponseError = func => func,
} = controller;

const Garden = require('../../models/garden');
const Tenure = require('../../models/tenure');

async function createGarden(params = {}) {
    const {
        id: keeperId,
    } = extractUserFromParams(params);

    params.ownerId = keeperId;
    // Add new garden
    const garden = await new Garden(params).insertIntoDB();
    const {
        id: gardenId,
    } = garden;
    // Create keeper's tenure of the garden
    await new Tenure({keeperId, gardenId, accessLevel: ACCESS_LEVELS.LANDOWNER});

    return garden.safeData;
}

function getGardens(params = {}) {
    const {
        id: ownerId = 0,
    } = extractUserFromParams(params);

    return Garden.getManyFromDB({ownerId});
}

async function getOneGarden(params = {}) {
    const {
        gardenId,
    } = params;
    const {
        id: keeperId = 0,
    } = extractUserFromParams(params);

    const garden = await Garden.getFromDB({id: gardenId});

    if (garden.ownerId === keeperId) {
        return garden;
    }

    const tenure = await Tenure.getFromDB({keeperId, gardenId});
    if (!tenure) {
        throwResponseError(STATUS_CODES.FORBIDDEN, API_CODES.GARDEN_ACCESS_DENIED, 'You have no power here');
    }

    if (tenure.accessLevel > ACCESS_LEVELS.POACHER) {
        return garden;
    }

    throwResponseError(STATUS_CODES.FORBIDDEN, API_CODES.GARDEN_ACCESS_DENIED, 'You have no power here');
}

async function getAvailableList(params = {}) {
    const {
        id: keeperId = 0,
    } = extractUserFromParams(params);

    const tenures = await Tenure.getManyFromDB({keeperId});
    const gardenId = tenures.map(tenure => tenure.gardenId);

    return Garden.getManyFromDB({id: gardenId});
}

module.exports = {
    accessLevel: ACCESS_LEVELS.KEEPER,
    create: wrapMethod(createGarden),
    read: wrapMethod(getOneGarden),
    list: wrapMethod(getGardens),
    listAvailable: wrapMethod(getAvailableList),
};