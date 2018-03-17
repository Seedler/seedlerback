'use strict';

// const projectKeeper = require('../../libs/projectKeeper');
// const logger = projectKeeper.getLogger('api/v1/garden');
const controller = require('../../controller');
const {
    ACCESS_LEVELS = {},
    wrapMethod = func => func,
    extractUserFromParams = func => func,
} = controller;

const Garden = require('../../models/garden');
const Tenure = require('../../models/tenure');

async function addGarden(params = {}) {
    const {
        id,
    } = extractUserFromParams(params);

    params.ownerId = id;

    const garden = await new Garden(params).insertIntoDB();

    return garden.safeData;
}

function getGardens(params = {}) {
    const {
        id: ownerId = 0,
    } = extractUserFromParams(params);

    return Garden.getManyFromDB({ownerId});
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
    add: wrapMethod(addGarden),
    list: wrapMethod(getGardens),
    listAvailable: wrapMethod(getAvailableList),
};