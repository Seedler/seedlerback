'use strict';

const config = require('seedler:config');
const logger = config.getLogger('Router');
const controller = require('seedler:controller');
const express = require('express');
const router = express.Router();
const {
    app = {},
} = config;

function setRoutesForModule(version, moduleName, module) {
    router.all(`/${version}/${moduleName}/:action`, (req, res) => {
        controller.routeHandler(req, res, module);
    });
    router.all(`/${version}/${moduleName}/:type/:action`, (req, res) => {
        controller.routeHandler(req, res, module);
    });
}

function setRoutesForVersion(version = 'v1', modules = {}) {
    const moduleNames = Object.keys(modules);
    for (let moduleName of moduleNames) {
        const module = modules[moduleName];
        setRoutesForModule(version, moduleName, module);
    }
}

function setModulesRoutes(modules = {}) {
    const versions = Object.keys(modules);
    for (let version of versions) {
        const versionModules = modules[version];
        setRoutesForVersion(version, versionModules);
    }
}

module.exports = function() {
    logger.info(`Try to initialize api controller`);
    // Set express app use router
    app.use('/', router);

    const apiModules = require('require-all')(config.rootDir + '/api');
    setModulesRoutes(apiModules);
};