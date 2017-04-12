import ArgParser from '../src/ArgParser'
import { expect } from 'chai';
import cli from "./cli";

const args2argv = (line) => [__dirname, __filename].concat(line.replace(/\s+/g, ' ').split(' '));

describe('ArgParser', function() {
    let argParser
    
    beforeEach(function() {
        argParser = new ArgParser(cli);
        argParser.configure(
            { errorHandler: () => {} }
        );
    });

    it('should parse a command', function() {
        const pgmSpec = argParser.parse(args2argv('check'));
        expect(pgmSpec.command).to.equal('check');
    });

    it('should error on an invalid command', function() {
        const pgmSpec = argParser.parse(args2argv('choock'));
        expect(pgmSpec.error.id).to.equal('Unknown command');
    });

    it('should error on an invalid option', function() {
        const pgmSpec = argParser.parse(args2argv('check -chicken'));
        expect(pgmSpec.error.id).to.equal('Unknown option');
    });

    it('should allow custom error handlers', function() {
        let errId, errMsg;
        argParser.configure({errorHandler: (id, msg) => {
            errId = id;
            errMsg = msg;
        } });
        const pgmSpec = argParser.parse(args2argv('choock'));
        expect(errId).to.equal('Unknown command');
    });

    it('should parse a flag option', function() {
        const pgmSpec = argParser.parse(args2argv('check -n'));
        expect(pgmSpec.command).to.equal('check');
        expect(pgmSpec.opts.noop).to.equal(true);
    });

    describe.skip('flag options', function() {
        it('should reject an argument after flag option', function() {
            const pgmSpec = argParser.parse(args2argv('check -n false'));
            expect(pgmSpec.command).to.equal('check');
            expect(pgmSpec.opts.noop).to.equal(true);
        });
    });
    
});