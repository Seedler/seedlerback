'use strict';

const projectKeeper = require('../../libs/projectKeeper');
const logger = projectKeeper.getLogger('api/v1/auth');
const controller = require('../../controller');
const passport = require('passport');

const {
    sRequestObject,
    sResponseObject,
    ACCESS_LEVELS,
    API_CODES,
    STATUS_CODES,
} = controller;

logger.info(`Load api`);

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
        controller.throwResponseError(STATUS_CODES.NOT_ALLOWED, API_CODES.ALREADY_AUTHORIZED, `You have to logout ${user.login} before login, ${user.name}`);
    }

    return passportLoginHandler(req, res);
}

function logout(params = {}) {
    const {
        [sRequestObject]: req = {},
    } = params;

    req.logout();
}

module.exports = {
    login: controller.wrapMethod(login),
    logout: controller.wrapMethod(logout, {accessLevel: ACCESS_LEVELS.KEEPER}),
};