/* eslint-env mocha */
import ArgParser from '../src/ArgParser'
import chai, { expect } from 'chai'
import dirtyChai from 'dirty-chai'
import stringArgv from 'string-argv'
import cli from './cli'
chai.use(dirtyChai)

const cliWithDefaultCommand = {...cli,
  commands: [...cli.commands, {
    command: 'def',
    desc: 'Default command',
    default: true
  }]}

const cliWithDefaultOption = {...cli,
  options: [...cli.options, {
    aliases: ['mode', 'm'],
    desc: 'Mode',
    default: 'test'
  }]
}

const args2argv = (line) => {
  return [__dirname, __filename, ...stringArgv(line)]
}

describe('ArgParser', function () {
  let argParser

  beforeEach(function () {
    argParser = new ArgParser(cli)
    argParser.configure({
      errorHandler: () => {},
      reportHelpContent: true
    })
  })

  describe('commands', function () {
    it('should parse a command', function () {
      const pgmSpec = argParser.parse(args2argv('check'))
      expect(pgmSpec.command).to.equal('check')
    })

    it('should error on an invalid command', function () {
      const pgmSpec = argParser.parse(args2argv('choock'))
      expect(pgmSpec.error.id).to.equal('Unknown command')
    })

    it('should parse a default command', function () {
      argParser = new ArgParser(cliWithDefaultCommand)
      const pgmSpec = argParser.parse(args2argv(''))
      expect(pgmSpec.command).to.equal('def')
    })

    it('should parse a default command with options', function () {
      argParser = new ArgParser(cliWithDefaultCommand)
      const pgmSpec = argParser.parse(args2argv('-n'))
      expect(pgmSpec.command).to.equal('def')
      expect(pgmSpec.opts.noop).to.be.true()
    })
  })

  it('should error on an invalid option', function () {
    const pgmSpec = argParser.parse(args2argv('check -chicken'))
    expect(pgmSpec.error.id).to.equal('Unknown option')
  })

  it('should allow custom error handlers', function () {
    let errId
    argParser.configure({errorHandler: (id, msg) => {
      errId = id
    } })
    argParser.parse(args2argv('choock'))
    expect(errId).to.equal('Unknown command')
  })

  describe('help', function () {
    it('should provide help on absent command', function () {
      const pgmSpec = argParser.parse(args2argv(''))
      expect(pgmSpec.helpContent).to.contain('Usage:')
    })

    it('should not provide help on absent command if there is a default command', function () {
      argParser = new ArgParser(cliWithDefaultCommand)
      const pgmSpec = argParser.parse(args2argv(''))
      expect(pgmSpec.command).to.equal('def')
      expect(pgmSpec.helpContent).to.be.undefined()
    })

    it('should provide help on -help', function () {
      const pgmSpec = argParser.parse(args2argv('-help'))
      expect(pgmSpec.helpContent).to.contain('Usage:')
    })

    it('should provide help on -h', function () {
      const pgmSpec = argParser.parse(args2argv('-h'))
      expect(pgmSpec.helpContent).to.contain('Usage:')
    })

    it('should provide help on "help"', function () {
      const pgmSpec = argParser.parse(args2argv('help'))
      expect(pgmSpec.helpContent).to.contain('Usage:')
    })
  })

  describe('options', function () {
    it('should parse a flag option', function () {
      const pgmSpec = argParser.parse(args2argv('check -n'))
      expect(pgmSpec.command).to.equal('check')
      expect(pgmSpec.opts.noop).to.equal(true)
    })

    it('should allow an argument for a flag option', function () {
      const pgmSpec = argParser.parse(args2argv('check -noop on'))
      expect(pgmSpec.opts.noop).to.equal('on')
    })

    it('should allow aliases', function () {
      const pgmSpec = argParser.parse(args2argv('check -n on'))
      expect(pgmSpec.opts.noop).to.equal('on')
    })

    it('should name the option based on alias not argument name', function () {
      const pgmSpec = argParser.parse(args2argv('check -u me'))
      expect(pgmSpec.opts.user).to.equal('me')
    })

    it('should permit specified values', function () {
      const pgmSpec = argParser.parse(args2argv('check -i mdwe'))
      expect(pgmSpec.opts.instance).to.equal('mdwe')
    })

    it('should prevent restricted values', function () {
      const pgmSpec = argParser.parse(args2argv('check -i goofus'))
      expect(pgmSpec.error.id).to.equal('Illegal value')
    })
    
    it('should prevent restricted values in a list', function () {
      const pgmSpec = argParser.parse(args2argv('check -i mdwe,goofus'))
      expect(pgmSpec.error.id).to.equal('Illegal value')
    })

    // TODO: This is wrong! It should be false.
    describe.skip('flag options', function () {
      it('should reject an argument after flag option', function () {
        const pgmSpec = argParser.parse(args2argv('check -n false'))
        expect(pgmSpec.command).to.equal('check')
        expect(pgmSpec.opts.noop).to.equal(true)
      })
    })
  })

  describe('default options', function () {
    it('should apply default values to options that specify them', function () {
      argParser = new ArgParser(cliWithDefaultOption)
      const pgmSpec = argParser.parse(args2argv('check'))
      expect(pgmSpec.opts.mode).to.equal('test')
    })

    it('should overwrite default values supplied as arguments', function () {
      argParser = new ArgParser(cliWithDefaultOption)
      const pgmSpec = argParser.parse(args2argv('check -m prod'))
      expect(pgmSpec.opts.mode).to.equal('prod')
    })
  })

  describe('list options', function () {
    it('should allow multiple values', function () {
      const pgmSpec = argParser.parse(args2argv('check -u you,me'))
      expect(pgmSpec.opts.user).to.eql(['you', 'me'])
    })

    // Need to have options declare whether they take numeric options or not
    it('should allow multiple numeric values', function () {
      const pgmSpec = argParser.parse(args2argv('check -u 35,34'))
      expect(pgmSpec.opts.user).to.eql([35, 34])
    })

    it('should allow spaces between list values', function () {
      const pgmSpec = argParser.parse(args2argv('check -u you, me'))
      expect(pgmSpec.opts.user).to.eql(['you', 'me'])
    })
    
    it('should treat quoted values as single arguments', function () {
      const pgmSpec = argParser.parse(args2argv('check -u "you, me"'))
      expect(pgmSpec.opts.user).to.equal('you, me')
    })

    // Because of the way argv is processed, it won't be possible to distinguish these.
    // We'd need to have options declare whether they can take lists to make progress.
    it.skip('should treat quoted values as single arguments even without a space', function () {
      const pgmSpec = argParser.parse(args2argv('check -u "you,me"'))
      expect(pgmSpec.opts.user).to.equal('you, me')
    })
  })
})
