'use strict';

const modulePath = require('./requireLinker');
const config = require('seedler:config');
const logger = config.getLogger('launch');

// Make promise function from done-callback-function
function makePromiseFunction(func) {
    return new Promise((resolve, reject) => {
        func(err => {
            if (err) {
                reject(err);
            }

            resolve();
        });
    });
}

module.exports = app => {
    app.stage = dir => {
        const func = require(modulePath.getAbsolutePath(dir));
        if (typeof func !== 'function') {
            const err = new Error(`Launch stage param is not a function ${func}`);
            logger.error(err);
            throw err;
        }

        let taskChain = app._taskChain;
        if (!Array.isArray(taskChain)) {
            taskChain = app._taskChain = [];
        }

        taskChain.push(func);

        logger.info('Add new stage to launch: ', dir);

        return app;
    };

    app.run = Promise.resolve().then(() => {

        logger.info('Seedler liftoff!');
        let promise = Promise.resolve();

        const taskChain = app._taskChain || [];
        while(taskChain.length) {
            const task = taskChain.shift();
            // Task can only have max one argument 'done' as callback
            const taskWithDoneCallback = task.length > 0;

            if (taskWithDoneCallback) {
                promise = promise.then(() => makePromiseFunction(task));
            }
            else {
                promise = promise.then(task);
            }
        }

        return promise;
    });

    return app;
};