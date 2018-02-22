'use strict';

const config = require('seedler:config');
const logger = config.getLogger('Controller');

// symbols helpers (pass response args)
const sMethodName = Symbol('sMethodName');
const sMethodVersion = Symbol('sMethodVersion');
const sRequestParams = Symbol('sRequestParams');
const sRequestUrl = Symbol('sRequestUrl');
const sRequestMethod = Symbol('sRequestMethod');
const sRequestHeaders = Symbol('sRequestHeaders');
const sResponseCode = Symbol('sResponseCode');
const sAuthorizedUser = Symbol('sAuthorizedUser');
const sSecure = Symbol('sSecure');

const PERMISSION_LEVELS = Object.freeze({
    all: 0, // Public permissions
    user: 1, // Only for registered users and upper
    support: 2, // Only for support managers (moderators) and upper
    root: 3, // Administrators only
    system: 4, // System private method
});

const {
    packageDescription,
} = config;

function throwResponseError(code = 418, message = 'Unknown reason') {
    const err = new Error(message);
    err[sResponseCode] = code;
    throw err;
}

function wrapMethod(method, params = {}) {
    const {
        permissionLevel = PERMISSION_LEVELS.all,
    } = params;

    method.permissionLevel = permissionLevel;

    return method;
}

/**
 * Определяем наименование публичного метода, к которому происходит обращение.
 * Метод обязательно должен быть назван в стиле lowerCamelCase, а обращение к нему возможно как в стиле lowerCamelCase так и в стиле snake_case
 * Список допустимых методов и действий находится в файле api в возвращаемой секции
 *
 * @param {Object} req
 * @returns {{requestHandler: Function, apiName: String, methodName: String, api: Object, version: String}}
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
    const api = require(`seedler:api/${version}/${apiName}`);

    if (typeof api !== 'object') {
        throwResponseError(404, `Undefined api: url: ${url}`);
    }

    let methodName = action;
    if (type) {
        methodName += type[0].toUpperCase() + type.slice(1);
    }

    const requestHandler = api[methodName];
    if (typeof requestHandler !== 'function') {
        throwResponseError(404, `Undefined api method: ${methodName} from url: ${url}`);
    }

    return {
        api,
        apiName,
        methodName,
        version,
        requestHandler,
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
                apiVersionName
            } = methodData;

            logger.info(`WebServer: Get params for route ${url} to use in method ${methodName}`);

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
        .then(result => {
            const response = {
                type: 'success',
                body: result,
            };

            if (typeof result === 'object') {
                const responseCode = result[sResponseCode];
                if (responseCode) {
                    response[sResponseCode] = responseCode;
                }
            }

            return response;
        })
        .catch(err => {
            const errorCode = err[sResponseCode] || '500';

            return {
                type: 'error',
                body: err.toString(),
                [sResponseCode]: errorCode,
            };
        })
        .then(result => {
            // Send response to the client
            logger.info(`Send response with result for url ${req.url}`);
            return sendResponse(res, result);
        })
        .catch(err => {
            logger.error(`routesHandler: Handling ${req.url} Unknown Error:`, err);
        })
    ;
}

function sendResponse(res = {}, result = {}) {
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

module.exports = {
    // Middleware for all api-requests
    routeHandler,
    wrapMethod,

    sMethodName,
    sMethodVersion,
    sRequestParams,
    sRequestUrl,
    sRequestMethod,
    sRequestHeaders,
    sResponseCode,
    sAuthorizedUser,
    sSecure,

    PERMISSION_LEVELS,

    packageDescription,
};