'use strict';

const projectKeeper = require('../../libs/projectKeeper');
const logger = projectKeeper.getLogger('api/v1/auth');
const controller = require('../../controller');
const Keeper = require('../../models/keeper');
const passport = require('passport');

const {
    sRequestObject,
    sResponseObject,
    ACCESS_LEVELS,
    API_CODES,
    STATUS_CODES,
} = controller;

logger.info(`Load api`);

function signup(params = {}) {
    logger.debug(`Signup: try to create new keeper with params: `, JSON.stringify(params, null, 2));
    // Check for keeper existence
    return Keeper.getFromDB(params)
        .then(user => {
            const {
                login,
                email,
            } = user;

            if (email === params.email) {
                controller.throwResponseError(STATUS_CODES.BAD_REQUEST, API_CODES.EMAIL_ALREADY_EXISTS, `signup: email already exists: ${params.email}`);
            }
            else if (login === params.login) {
                controller.throwResponseError(STATUS_CODES.BAD_REQUEST, API_CODES.LOGIN_ALREADY_EXISTS, `signup: login already exists: ${params.login}`);
            }
            else {
                controller.throwResponseError(STATUS_CODES.BAD_REQUEST, API_CODES.INVALID_INPUT, `signup: get invalid signup data`);
            }
        })
        .catch(err => {
            const apiCode = err[controller.sApiResponseCode];
            if (apiCode !== API_CODES.KEEPER_NOT_FOUND) {
                throw err;
            }

            const keeper = new Keeper(params);

            return keeper.insertIntoDB();
        })
        .then(keeperItem => {
            logger.debug(`Signup: create new keeper with _id`, keeperItem._id);
            return keeperItem;
        })
    ;
}

// TODO: promisify passport methods
function passportLoginHandler(req, res) {
    return new Promise((resolve, reject) => {
        /** @namespace passport.authenticate */
        passport.authenticate('local', (err, user) => {
            if (err) {
                reject(err);
            }
            if (!user) {
                controller.throwResponseError(STATUS_CODES.BAD_REQUEST, API_CODES.INVALID_AUTH_INPUT, 'Invalid login or password');
            }

            req.logIn(user, err => {
                if (err) {
                    reject(err);
                }

                resolve({_id: user._id});
            });
        })(req, res);
    });
}

function login(params = {}) {
    const {
        [sRequestObject]: req = {},
        [sResponseObject]: res = {},
    } = params;
    // Deny duplicate login
    const {
        user,
    } = req;
    if (user) {
        controller.throwResponseError(STATUS_CODES.FORBIDDEN, API_CODES.ALREADY_AUTHORIZED, `You have to logout ${user.login} before login, ${user.name}`);
    }

    return passportLoginHandler(req, res);
}

function logout(params = {}) {
    const {
        [sRequestObject]: req = {},
    } = params;

    req.logout();
}

function getAuthUser(params = {}) {
    const {
        [sRequestObject]: req = {},
    } = params;
    const {
        user,
    } = req;

    return user;
}

module.exports = {
    signup: controller.wrapMethod(signup),
    login: controller.wrapMethod(login),
    logout: controller.wrapMethod(logout, {accessLevel: ACCESS_LEVELS.KEEPER}),
    user: controller.wrapMethod(getAuthUser, {accessLevel: ACCESS_LEVELS.KEEPER}),
};