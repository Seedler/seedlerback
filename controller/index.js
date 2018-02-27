'use strict';

const config = require('../config');
const projectKeeper = require('../libs/projectKeeper');
const logger = projectKeeper.getLogger('Controller');

// symbols helpers (pass response args)
const sMethodName = Symbol('sMethodName');
const sMethodVersion = Symbol('sMethodVersion');
const sRequestParams = Symbol('sRequestParams');
const sRequestUrl = Symbol('sRequestUrl');
const sRequestMethod = Symbol('sRequestMethod');
const sRequestHeaders = Symbol('sRequestHeaders');
const sResponseCode = Symbol('sResponseCode');
const sApiResponseCode = Symbol('sApiResponseCode');
const sRequestObject = Symbol('sRequestObject');
const sResponseObject = Symbol('sResponseObject');
const sAuthorizedUser = Symbol('sAuthorizedUser');
const sSecure = Symbol('sSecure');

// TODO: Put in a separate files
const STATUS_CODES = Object.freeze({
    success: 200,

    badRequest: 400,
    unauthorized: 401,
    notFound: 404,
    notAllowed: 405,
    teapot: 418,
    locked: 423,

    serverError: 500,
});
const API_CODES = Object.freeze({
    success: 200,
    unknown: 400,
    accessDenied: 401,
    userNotFound: 402,
    unauthorized: 403,
    apiNotFound: 404,
    apiMethodNotFound: 405,
    alreadyAuthorized: 406,
    invalidInput: 407,
});
const ACCESS_LEVELS = Object.freeze({
    all: 0, // Public permissions
    keeper: 1, // Only for registered users and upper
    support: 2, // Only for support managers (moderators) and upper
    root: 3, // Administrators only
    system: 4, // System private method

    // Tenure privileges
    poacher: 0, // let it be
    watcher: 1, // Read only
    surveyor: 2, // Read only with edit suggestions
    tenant: 3, // Reader with editing permission
    landowner: 4, // Full privileges for forest editing
});

const {
    packageDescription,
} = config;

function throwResponseError(code = STATUS_CODES.teapot, apiCode = API_CODES.unknown, message = 'Unknown reason') {
    const err = new Error(message);
    err[sResponseCode] = code;
    err[sApiResponseCode] = apiCode;
    throw err;
}

function wrapMethod(method, params = {}) {
    const {
        accessLevel = ACCESS_LEVELS.all,
    } = params;

    method.accessLevel = accessLevel;

    return method;
}

/**
 * Определяем наименование публичного метода, к которому происходит обращение.
 * Метод обязательно должен быть назван в стиле lowerCamelCase, а обращение к нему возможно как в стиле lowerCamelCase так и в стиле snake_case
 * Список допустимых методов и действий находится в файле api в возвращаемой секции
 *
 * @param {Object} req
 * @returns {{requestHandler: Function, apiName: String, methodName: String, api: Object, version: String, accessLevel: number}}
 */
function getMethodData(req = {}) {
    const {
        url = '',
        params = {},
    } = req;

    let {
        apiName = '',
        type = '',
        action = '',
        version = 'v1',
    } = params;

    // Require js api file from ./api dir
    const api = require(`../api/${version}/${apiName}`);
    if (typeof api !== 'object') {
        throwResponseError(STATUS_CODES.notFound, API_CODES.apiNotFound, `Undefined api: url: ${url}`);
    }

    let methodName = action;
    if (type) {
        methodName += type[0].toUpperCase() + type.slice(1);
    }

    const requestHandler = api[methodName];
    if (typeof requestHandler !== 'function') {
        throwResponseError(STATUS_CODES.notFound, API_CODES.apiMethodNotFound, `Undefined api method: ${methodName} from url: ${url}`);
    }

    const apiAccessLevel = api.accessLevel;
    const accessLevel = requestHandler.accessLevel;

    return {
        api,
        apiName,
        methodName,
        version,
        requestHandler,
        accessLevel,
        apiAccessLevel,
    };
}

function setControlHeaders(res = {}, params = {}) {
    // Information about package version
    res.setHeader('X-VERSION', packageDescription);
    // Only usual requests permitted
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // No frames
    res.setHeader('X-Frame-Options', 'DENY');
    // TODO: Add adjustable cache-control settings
    res.setHeader('Cache-Control', 'no-cache');
}

function routeHandler(req = {}, res = {}) {
    logger.info(`Get request for route ${req.url}`);

    return Promise.resolve()
        .then(() => getMethodData(req))
        .then(methodData => {
            const {
                method,
                headers,
                params,
                url,
                body,
                user,
            } = req || {};

            const {
                requestHandler,
                methodName,
                apiVersionName,
                accessLevel = ACCESS_LEVELS.all,
                apiAccessLevel = ACCESS_LEVELS.all,
            } = methodData;

            logger.debug(`WebServer: Get params for route ${url} to use in method ${methodName}, user ${user}`);

            // Check permissions (api permissions has priority)
            checkPermissions(user, Math.max(apiAccessLevel, accessLevel));

            body[sRequestObject] = req;
            body[sResponseObject] = res;

            body[sRequestUrl] = url;
            body[sRequestHeaders] = headers;
            body[sRequestMethod] = method;
            body[sRequestParams] = params;
            body[sMethodName] = methodName;
            body[sMethodVersion] = apiVersionName;
            body[sAuthorizedUser] = user;

            // Include headers into response object
            setControlHeaders(res, req.body);

            return requestHandler(body);
        })
        .then(result => createResponseObject(result))
        .catch(err => createResponseObject(err))
        .then(result => sendResponse(req, res, result))
        .catch(err => {
            logger.error(`routesHandler: Handling ${req.url} Unknown Error:`, err);
        })
    ;
}

function createResponseObject(resultObject = {}) {
    // Error response object is specific and should be handled separately
    if (resultObject instanceof Error) {
        const errorCode = resultObject[sResponseCode] || STATUS_CODES.serverError;
        const apiCode = resultObject[sApiResponseCode] || API_CODES.unknown;

        return {
            type: 'error',
            code: apiCode,
            body: resultObject.toString(),
            [sResponseCode]: errorCode,
        };
    }

    // Standard response object
    const apiCode = resultObject[sApiResponseCode] || API_CODES.success;
    const responseObject = {
        type: 'success',
        code: apiCode,
        body: resultObject,
    };

    if (typeof resultObject === 'object') {
        const responseCode = resultObject[sResponseCode];
        if (responseCode) {
            responseObject[sResponseCode] = responseCode;
        }
    }

    return responseObject;
}

function sendResponse(req = {}, res = {}, result = {}) {
    logger.debug(`sendResponse: ${req.url}`);

    const statusCode = result[sResponseCode] || 200;
    if (statusCode !== 200) {
        try {
            res.status(statusCode);
        }
        catch(err) {
            logger.error('sendResponse: set response status error: ', err);
        }
    }

    res.json(result);
    return true;
}

function accessDenied(user, methodAccessLevel = 0) {
    let accessDenied = false;

    if (!user) {
        if (methodAccessLevel > ACCESS_LEVELS.all) {
            accessDenied = true;
        }
    }
    else if (user.accessLevel < methodAccessLevel) {
        accessDenied = true;
    }

    return accessDenied;
}

function checkPermissions(user, methodPermissions = 0) {
    const isAccessDenied = accessDenied(user, methodPermissions);
    if (isAccessDenied) {
        if (user) {
            throwResponseError(STATUS_CODES.notAllowed, API_CODES.accessDenied, 'You have no power here');
        }
        else {
            throwResponseError(STATUS_CODES.unauthorized, API_CODES.unauthorized, 'You have no power. Authorize, please');
        }
    }
}

module.exports = {
    // Middleware for all api-requests
    routeHandler,
    wrapMethod,

    sRequestObject,
    sResponseObject,
    sMethodName,
    sMethodVersion,
    sRequestParams,
    sRequestUrl,
    sRequestMethod,
    sRequestHeaders,
    sResponseCode,
    sAuthorizedUser,
    sSecure,

    ACCESS_LEVELS,
    API_CODES,
    STATUS_CODES,

    throwResponseError,
    packageDescription,
};