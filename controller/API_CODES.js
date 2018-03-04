'use strict';

module.exports = Object.freeze({
    // Custom statuses starts from 0
    SUCCESS: 0,

    // Custom error statuses starts from 100
    UNKNOWN: 100,
    UNAUTHORIZED: 101,
    ALREADY_AUTHORIZED: 102,

    // Access error statuses start from 200
    ACCESS_DENIED: 200,
    METHOD_ACCESS_DENIED: 201,

    KEEPER_ACCESS_DENIED: 202,
    SEED_ACCESS_DENIED: 203,
    FOREST_ACCESS_DENIED: 204,

    // Invalid input error statuses starts with 300
    INVALID_INPUT: 300,
    INVALID_AUTH_INPUT: 301, // Invalid login or pass
    LOGIN_ALREADY_EXISTS: 302, // Invalid signup login
    EMAIL_ALREADY_EXISTS: 303, // Invalid signup email
    INVALID_LENGTH: 304,
    INVALID_SYMBOL: 305,
    REQUIRED_INPUT: 306,
    RESERVED_WORD: 307,
    NOT_EMAIL: 308,

    // If something not found error would start from 400
    NOT_FOUND: 400,
    API_NOT_FOUND: 401,
    METHOD_NOT_FOUND: 402,

    KEEPER_NOT_FOUND: 403,
    SEED_NOT_FOUND: 404,
    TREE_NOT_FOUND: 405,
    VARIETY_NOT_FOUND: 406,
    FOREST_NOT_FOUND: 407,
});