'use strict';

const projectKeeper = require('../libs/projectKeeper');
const logger = projectKeeper.getLogger('Passport');

// Debug test keeper
const keeper = {
    _id: 1,
    name: 'Тест Тестов',
    login: 'test',
    password: '12345',
    accessLevel: 1,
};

function localLoginHandler(login, password, done) {
    logger.info(`Passport want to auth user:`, login, password);

    if (keeper.password === password) {
        return done(null, keeper);
    }

    return done(null, false);
}

module.exports = function() {
    logger.info(`Try to initialize authorization`);
    const passport = require('passport');
    const LocalStrategy = require('passport-local').Strategy;
    const session = require('express-session');
    const RedisStore = require('connect-redis')(session);

    const {
        // Should be added at prev setup stage
        redis = {},
        app = {},
    } = projectKeeper;

    // Set special middleware for auth
    app.use(session({
        // Use existed redis-client as session store
        store: new RedisStore({client: redis}),
        secret: `seedlerSecureSecret12345`,
        resave: true,
        saveUninitialized: false,
        cookie: {
            secure: false
        },
    }));
    /** @namespace passport.initialize */
    app.use(passport.initialize());
    /** @namespace passport.session */
    app.use(passport.session());

    // Set login handler
    /** @namespace passport.use */
    passport.use(new LocalStrategy({
        usernameField: 'login',
        passwordField: 'password',
    }, localLoginHandler));

    // Serializer
    /** @namespace passport.serializeUser */
    passport.serializeUser((user, done) => {
        logger.debug(`Auth middleware want to set user with its id ${user._id}`);
        done(null, user._id);
    });
    /** @namespace passport.deserializeUser */
    passport.deserializeUser((id, done) => {
        logger.debug(`Auth middleware want to get user by id ${id}`);
        done(null, keeper);
    });
};