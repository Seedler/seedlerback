'use strict';

const Module = require('module');
const path = require('path');

const linkedModulesList = [];

function getAbsolutePath(dir) {
    if (!path.isAbsolute(dir)) {
        dir = `${__dirname}/../${dir}/`;
    }
    return path.normalize(`${dir}/`);
}

function getModuleName(dir = '') {
    const dirData = path.parse(dir);
    return dirData.name;
}

// Module._resolveFilename (require) middleware
const resolveFileName = Module._resolveFilename;
Module._resolveFilename = (requiredPath, parent, isMain) => {
    // TODO: may be need optimization with only ':'-routes permission for next analysis
    const pathParts = requiredPath.split('/');
    // Main linker part ('seedler:config' for example)
    const pathRouteName = pathParts.shift();
    // Child part of path ('libs/someConnector' from 'seedler:config/someConnector')
    const childPath = pathParts.join('/');

    // Find main linker parts in known array
    const pathItem = linkedModulesList.find(pathItem => pathItem.moduleLink === pathRouteName);
    if (pathItem) {
        requiredPath = pathItem.modulePath;

        if (childPath) {
            requiredPath += `/${childPath}`;
        }
    }

    // require file
    return resolveFileName.call(Module, requiredPath, parent, isMain);
};

module.exports = {
    link(name, dir) {
        const moduleName = getModuleName(dir);
        const modulePath = getAbsolutePath(dir);

        const moduleLink = `${name}:${moduleName}`;
        const linkItem = {moduleLink, modulePath};

        linkedModulesList.push(linkItem);
    },
    bind(moduleLink, dir) {
        const modulePath = getAbsolutePath(dir);
        const linkItem = {moduleLink, modulePath};

        linkedModulesList.push(linkItem);
    },
    getAbsolutePath,
    getModuleName,
};