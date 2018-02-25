'use strict';

const config = require('../config');
config.linkGlobalPaths();

const Keeper = require('seedler:models/keeper');
// const logger = config.getLogger('MongoConnector');
const expect = require('expect.js');

const validInputData = {
    login: 'testLogin',
    name: ' Test Model Junior',
    email: 'test.some@domain.com',
    password: '123456',
};

let validKeeper;

describe('Test Keeper model', () => {
    it('Create valid keeper', () => {
        const keeper = new Keeper(validInputData);
        expect(keeper).not.to.equal(null);
        expect(keeper).to.be.an('object');
        expect(keeper).to.not.have.key('password');
        expect(keeper).to.have.keys(['passwordSalt', 'passwordHash', 'updatedAt', 'createdAt']);

        validKeeper = keeper;
    });

    it('Create new keeper from existed data', () => {
        // No password key in keeper from DB
        delete validKeeper.password;

        const keeper = new Keeper(validKeeper);
        expect(keeper).not.to.equal(null);
        expect(keeper).to.be.an('object');
        expect(keeper).to.have.keys(['passwordSalt', 'passwordHash', 'updatedAt', 'createdAt']);
    });

    it('Create keeper with restricted login (expect Error)', () => {
        const invalidInputData = Object.assign({}, validInputData, {login: 'admin'});

        let errorObject = null;
        try {
            new Keeper(invalidInputData);
        }
        catch(err) {
            errorObject = err;
        }

        expect(errorObject).to.be.an(Error);
    });

    it('Create keeper with short login (expect Error)', () => {
        const invalidInputData = Object.assign({}, validInputData, {login: 'abc'});

        let errorObject = null;
        try {
            new Keeper(invalidInputData);
        }
        catch(err) {
            errorObject = err;
        }

        expect(errorObject).to.be.an(Error);
    });

    it('Create keeper with invalid login (expect Error)', () => {
        const invalidInputData = Object.assign({}, validInputData, {login: 'abc-17$2~abc'});

        let errorObject = null;
        try {
            new Keeper(invalidInputData);
        }
        catch(err) {
            errorObject = err;
        }

        expect(errorObject).to.be.an(Error);
    });

    it('Create keeper with invalid name (expect Error)', () => {
        const invalidInputData = Object.assign({}, validInputData, {name: 'Name With Dot.'});

        let errorObject = null;
        try {
            new Keeper(invalidInputData);
        }
        catch(err) {
            errorObject = err;
        }

        expect(errorObject).to.be.an(Error);
    });

    it('Create keeper with short name (expect Error)', () => {
        const invalidInputData = Object.assign({}, validInputData, {name: 'abc'});

        let errorObject = null;
        try {
            new Keeper(invalidInputData);
        }
        catch(err) {
            errorObject = err;
        }

        expect(errorObject).to.be.an(Error);
    });

    it('Create keeper with invalid password (expect Error)', () => {
        const invalidInputData = Object.assign({}, validInputData, {password: '12$12@3-45'});

        let errorObject = null;
        try {
            new Keeper(invalidInputData);
        }
        catch(err) {
            errorObject = err;
        }

        expect(errorObject).to.be.an(Error);
    });

    it('Create keeper with short password (expect Error)', () => {
        const invalidInputData = Object.assign({}, validInputData, {password: '12345'});

        let errorObject = null;
        try {
            new Keeper(invalidInputData);
        }
        catch(err) {
            errorObject = err;
        }

        expect(errorObject).to.be.an(Error);
    });

    it('Create keeper with invalid email domain (expect Error)', () => {
        const invalidInputData = Object.assign({}, validInputData, {email: 'test.keeper@domain'});

        let errorObject = null;
        try {
            new Keeper(invalidInputData);
        }
        catch(err) {
            errorObject = err;
        }

        expect(errorObject).to.be.an(Error);
    });

    it('Create keeper with invalid email address (expect Error)', () => {
        const invalidInputData = Object.assign({}, validInputData, {email: 'test.keeperdomain.com'});

        let errorObject = null;
        try {
            new Keeper(invalidInputData);
        }
        catch(err) {
            errorObject = err;
        }

        expect(errorObject).to.be.an(Error);
    });
});