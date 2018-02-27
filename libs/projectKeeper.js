'use strict';

const path = require('path');

function getAbsolutePath(dir) {
    if (!path.isAbsolute(dir)) {
        dir = `${__dirname}/../${dir}/`;
    }
    return path.normalize(`${dir}/`);
}
// Make promise function from done-callback-function
function makePromiseFunction(func) {
    return new Promise((resolve, reject) => {
        func((err, result) => {
            if (err) {
                reject(err);
            }

            resolve(result);
        });
    });
}

const projectKeeper = {
    Logger: require('log4js'),
    logLevel: process.env.LOG_LEVEL || 'DEBUG',

    launch() {
        const logger = this.getLogger();

        this.stage = dir => {
            console.log(dir);
            const func = require(getAbsolutePath(dir));
            if (typeof func !== 'function') {
                const err = new Error(`Launch stage param is not a function ${func}`);
                logger.error(err);
                throw err;
            }

            let taskChain = this._taskChain;
            if (!Array.isArray(taskChain)) {
                taskChain = this._taskChain = [];
            }

            taskChain.push({name: dir, task: func});

            logger.info('Add new stage to launch: ', dir);

            return this;
        };

        this.run = () => {
            logger.info('Seedler liftoff!');
            let promise = Promise.resolve();

            const taskChain = this._taskChain || [];
            while(taskChain.length) {
                const taskObj = taskChain.shift();
                const {
                    name,
                    task,
                } = taskObj;
                // Task can only have max one argument 'done' as callback
                const taskWithDoneCallback = task.length > 0;

                if (taskWithDoneCallback) {
                    promise = promise.then(() => makePromiseFunction(task));
                }
                else {
                    promise = promise.then(task);
                }

                // If setup routine returns Object - assign data on this
                promise = promise.then(returnValue => {
                    logger.debug(`Module ${name} launched`);
                    if (returnValue instanceof Object) {
                        Object.assign(this, returnValue);
                    }
                });
            }

            return promise;
        };

        return this;
    },
    getLogger: (env, lvl) => {
        const {
            Logger = require('log4js'),
        } = this;

        const logger = Logger.getLogger(env || 'projectKeeper');
        logger.setLevel(lvl || this.logLevel);

        return logger;
    },
};

module.exports = projectKeeper;