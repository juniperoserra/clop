import ArgParser from '../src/ArgParser'
import { expect } from 'chai';
import cli from "./cli";

const args2argv = (line) => {
    const args = [__dirname, __filename];
    line = line.trim().replace(/\s+/g, ' ');
    return args.concat(line ? line.split(' ') : []);
}

describe('ArgParser', function() {
    let argParser
    
    beforeEach(function() {
        argParser = new ArgParser(cli);
        argParser.configure({ 
            errorHandler: () => {},
            reportHelpContent: true
        });
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

    describe('help', function() {
        it('should provide help on absent command', function() {
            const pgmSpec = argParser.parse(args2argv(''));
            expect(pgmSpec.helpContent).to.contain('Usage:');
        });

        it('should not provide help on absent command if there is a default command', function() {
            argParser = new ArgParser({...cli, commands: [...cli.commands, {
                command: 'def',
                desc: 'Default command',
                default: true
            }]});
            const pgmSpec = argParser.parse(args2argv(''));
            expect(pgmSpec.command).to.equal('def');
            expect(pgmSpec.helpContent).to.be.undefined;
        });

        it('should provide help on -help', function() {
            const pgmSpec = argParser.parse(args2argv('-help'));
            expect(pgmSpec.helpContent).to.contain('Usage:');
        });

        it('should provide help on -h', function() {
            const pgmSpec = argParser.parse(args2argv('-h'));
            expect(pgmSpec.helpContent).to.contain('Usage:');
        });

        it('should provide help on "help"', function() {
            const pgmSpec = argParser.parse(args2argv('help'));
            expect(pgmSpec.helpContent).to.contain('Usage:');
        });
    });

    describe('options', function() {
        it('should parse a flag option', function() {
            const pgmSpec = argParser.parse(args2argv('check -n'));
            expect(pgmSpec.command).to.equal('check');
            expect(pgmSpec.opts.noop).to.equal(true);
        });

        it('should parse allow an argument if not specified', function() {
            const pgmSpec = argParser.parse(args2argv('check -noop on'));
            expect(pgmSpec.opts.noop).to.equal('on');
        });

        it('should allow aliases', function() {
            const pgmSpec = argParser.parse(args2argv('check -n on'));
            expect(pgmSpec.opts.noop).to.equal('on');
        });

        it('should name the option based on alias not argument name', function() {
            const pgmSpec = argParser.parse(args2argv('check -u me'));
            expect(pgmSpec.opts.user).to.equal('me');
        });

        it('should allow restricted values', function() {
            const pgmSpec = argParser.parse(args2argv('check -i goofus'));
            expect(pgmSpec.opts.instance).to.equal('goofus');
        });

        describe.skip('flag options', function() {
            it('should reject an argument after flag option', function() {
                const pgmSpec = argParser.parse(args2argv('check -n false'));
                expect(pgmSpec.command).to.equal('check');
                expect(pgmSpec.opts.noop).to.equal(true);
            });
        });
    });
    
});