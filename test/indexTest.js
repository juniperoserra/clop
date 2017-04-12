const clop = require('../src/index');
import { expect } from 'chai';
import { createArgParser } from '../src/index';

describe('Index', function() {
    it('should create an ArgParser using require', function() {
        const argParser = clop.createArgParser({});
        expect(argParser).to.be.ok;
    });

    it('should create an ArgParser using es6 import', function() {
        const argParser = createArgParser({});
        expect(argParser).to.be.ok;
    });
});