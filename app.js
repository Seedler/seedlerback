'use strict';

const projectKeeper = require('./libs/projectKeeper');
const logger = projectKeeper.getLogger('WebServer');

projectKeeper.launch()
    .stage('./setup/mongodb')
    .stage('./setup/redis')
    .stage('./setup/express')
    .stage('./setup/validate')
    .stage('./setup/passport')
    .stage('./setup/router')
    .run()
    .then(() => {
        const config = require('./config');
        const {
            port = 8080,
        } = config.server;

        logger.info(`App now listen on port ${port}...`);
        const {
            // Was assigned in setup/express
            app = {},
        } = projectKeeper;

        app.listen(port);

        logger.info('Seedler instance started!');
    })
    .catch(err => logger.error(err))
;

