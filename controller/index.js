'use strict';

const packageJSON = require('seedler:package');
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
const sSecure = Symbol('sSecure');

const packageDescription = `${packageJSON.name}#${packageJSON.version}`;

function throwResponseError(code = 418, message = 'Unknown reason') {
    const err = new Error(message);
    err[sResponseCode] = code;
    throw err;
}

/**
 * Определяем наименование публичного метода, к которому происходит обращение.
 * Метод обязательно должен быть назван в стиле lowerCamelCase, а обращение к нему возможно как в стиле lowerCamelCase так и в стиле snake_case
 * Список допустимых методов и действий находится в файле api в возвращаемой секции
 *
 * @param {Object} req
 * @param {Object} api
 * @returns {{requestHandler: Function, methodName: String, apiMethods: Object, version: String}}
 */
function getMethodData(req = {}, api = {}) {
    const {
        url = '',
        params = {},
    } = req;

    let {
        type = '',
        action = '',
        version = '',
    } = params;

    const apiMethods = api[version];

    if (!apiMethods) {
        throwResponseError(404, `Undefined version ${version} in ${url}`);
    }

    let methodName = action;
    if (type) {
        methodName += type[0].toUpperCase() + type.slice(1);
    }

    const requestHandler = apiMethods[methodName];
    if (typeof requestHandler !== 'function') {
        throwResponseError(404, `Undefined api method: ${methodName} from url: ${url}`);
    }

    return {
        requestHandler,
        methodName,
        apiMethods,
        version,
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

function routeHandler(req = {}, res = {}, api = {}) {
    logger.info(`Get request for route ${req.url}`);

    return Promise.resolve()
        .then(() => getMethodData(req, api))
        .then(methodData => {
            const {
                method,
                headers,
                params,
                url,
                body,
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
            return sendResponse(res, result);
        })
        .catch(err => {
            logger.error(`routesHandler: Handling ${req.url} Unknown Error:`, err);
        })
    ;
}

function sendResponse(res = {}, result = {}) {
    logger.info(`Send response with result for url ${req.url}`);

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

    sMethodName,
    sMethodVersion,
    sRequestParams,
    sRequestUrl,
    sRequestMethod,
    sRequestHeaders,
    sResponseCode,
    sSecure,

    packageDescription,
};