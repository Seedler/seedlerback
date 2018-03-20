'use strict';

module.exports = Object.freeze({
    ALL: 0,

    KEEPER: 1,
    SUPPORT: 2,
    ROOT: 3,
    SYSTEM: 4,

    // Additional access levels (gardens)
    LINK: 2,
    WHITELIST: 3,

    // Tenure privileges
    POACHER: 0, // Let it be
    WATCHER: 1, // Read only
    SURVEYOR: 2, // Read only with editing suggestions
    TENANT: 3, // Editor
    MODERATOR: 4,
    LANDOWNER: 5, // Full privileges for garden editing
});