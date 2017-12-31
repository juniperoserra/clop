/**
 * Created by sgreenwo on 12/11/16.
 */

const chalk = require('chalk')

// TODO: parameterize utils
const util = {}
util.assert = function (condition, msg) {
  if (!condition) {
    throw new Error('Assertion: ' + msg)
  }
}

util.assertAlways = function (msg) {
  throw new Error('Assertion: ' + msg)
}

util.errorAssertNoStack = function (condition, type, msg) {
  if (!condition) {
    util.assert(type && msg, 'Must error with both message type and message content')
    console.log(chalk.red('ERROR: ' + msg))
    process.exit(1)
  }
}

function _isString (s) {
  return typeof s === 'string' || s instanceof String
}

function _isNumeric (n) {
  return !isNaN(parseFloat(n)) && isFinite(n)
}

function _dashToUnderscore (word) {
  return word.replace(/-/g, '_')
}

function _underscoreToCamel (word) {
  return word.replace(/(_[a-z])/g, low => low[1].toUpperCase())
}

function _scrubOpt (arg) {
  return _underscoreToCamel(_dashToUnderscore(arg))
}

function _makeOptHash (optionsSpec) {
  const optHash = {}
  const defaults = {}
  optionsSpec.forEach(opt => {
    const argName = opt.optName || _scrubOpt(opt.aliases[0])
    if (opt.default !== undefined) {
      defaults[argName] = opt.default
    }
    opt.aliases.forEach(alias => {
      alias = _scrubOpt(alias)
      util.assert(!optHash[alias], 'Redundant option alias: ' + alias)
      optHash[alias] = { name: argName, values: opt.values }
    })
  })
  return {optHash, defaults}
}

function _asOption (arg, optHash) {
  if (!arg || !_isString(arg)) {
    return undefined
  }
  arg = arg.trim()
  if (arg[0] === '-') {
    arg = arg.replace(/^-+/, '')
  } else {
    return undefined
  }
  arg = _scrubOpt(arg)
  const optData = optHash[arg]
  if (!optData) {
    return undefined
  }

  return optData
}

function _asOptionName (arg, optHash) {
  const opt = _asOption(arg, optHash)
  return opt ? opt.name : undefined
}

function normalizeCmd (input) {
  return _underscoreToCamel(_dashToUnderscore(input)).toLowerCase()
}

function _produceError (id, msg, errorHandler) {
  if (errorHandler) {
    errorHandler(id, msg)
  } else {
    util.errorAssertNoStack(false, id, msg)
  }

  return {id, msg}
}

function _conditionalProduceError (cond, id, msg, errorHandler) {
  if (cond) {
    return
  }
  return _produceError(id, msg, errorHandler)
}

function _selectCommand (cmdList, arg, errorHandler) {
  arg = arg || ''
  let skipArgs = 1
  let command = arg
  for (let cmd of cmdList) {
    cmd.normalized = normalizeCmd(cmd.command)
  }

  let cmdObj
  if (!command || command[0] === '-') {
    cmdObj = cmdList.find(cmd => cmd.default)
    skipArgs = 0
  } else {
    cmdObj = cmdList.find(cmd => cmd.normalized === normalizeCmd(command))
  }

  const error = _conditionalProduceError(
        cmdObj,
        'Unknown command',
        `Unknown command "${arg}"\nPossible commands: ${cmdList.map(cmd => cmd.command).join(', ')}`,
        errorHandler)
  return [ cmdObj ? cmdObj.command : undefined, skipArgs, error ]
}

function _validateValue (opt, inValue, errorHandler) {
  let value = `${inValue}`.trim()
  const negated = (/^(no-|~|!)/).test(value)
  if (opt.values) {
    const bareValue = value.replace(/^(no-|~|!)/, '').toLowerCase()
    for (const matchValue of opt.values) {
      if (matchValue.toLowerCase() === bareValue) {
        return {value: (negated ? '!' : '') + matchValue}
      }
    }
    return {error: _produceError('Illegal value',
      `Value "${value}" not valid for option "${opt.name}." Allowed values are ${opt.values}`,
      errorHandler)}
  }
  return {value}
}

function _optDone (opts, opt, args, errorHandler) {
  const addElement = (element, array) => {
    if (_isNumeric(element)) {
      element = parseInt(element, 10)
    }
    const result = _validateValue(opt, element, errorHandler)
    array.push(element)
    return result
  }

  if (!opt && args.length === 0) {
    return
  }
  if (opt) {
    if (args.length === 0) { // Maybe check for legality of bool?
      opts[opt.name] = true
    } else {
      let fullArray = []
      for (const arg of args) {
        // TODO: Have opt specify whether or not it can support lists
        if (arg.includes(' ')) { // If there's a space in it, then it was in quotes
          const result = addElement(arg, fullArray)
          if (result.error) {
            return result
          }
        } else {
          for (const element of arg.split(',')) {
            if (element.length > 0) {
              const result = addElement(element, fullArray)
              if (result.error) {
                return result
              }
            }
          }
        }
      }
      if (fullArray.length === 1) {
        fullArray = fullArray[0]
      }
      opts[opt.name] = fullArray
    }
  }
}

function _parseOpts (args, optsHash, errorHandler) {
  const opts = {}
  let error
  let currentOpt = null
  let currentOptArgs = []
  for (const arg of (args || [])) {
    const nextOpt = _asOption(arg, optsHash)
    if (nextOpt) {
      const result = _optDone(opts, currentOpt, currentOptArgs, errorHandler)
      if (result && result.error) {
        return result
      }
      currentOpt = nextOpt
      currentOptArgs = []
    } else {
      error = _conditionalProduceError(
                  arg[0] !== '-' && currentOpt,
                  'Unknown option',
                  'Unknown option "' + arg + '"',
                  errorHandler
              )
      currentOptArgs.push(arg)
    }
  }
  const result = _optDone(opts, currentOpt, currentOptArgs, errorHandler)
  if (result && result.error) {
    return result
  }
  return {opts, error}
}

function _formatAliases (aliases) {
  const sortedAliases = aliases.slice(0) // Clone the array since sort is modifying
  return sortedAliases.sort((a, b) => a.length > b.length).map(alias => {
    return '-' + alias
  }).join(', ')
}

function _formatOpt (opt) {
  let str = _formatAliases(opt.aliases)
  if (opt.args) {
    str = str + ' ' + opt.args
  }
  return str
}

function _formatValues (opt) {
  let str = ''
  if (opt.values) {
    str = ' '
    str = str + '[' + opt.values.join(', ') + ']'
  }
  return str
}

// Command line format:
// single or double-dash equivalent
// no merged single letter opts

// Syntax
// command [arg] [value]

// Rule: first thing is command (plural or not)
// Rule: if it starts with - or --, it's an option
// Rule: plurals allowed for most options
// Rule: we can allow spaces inside lists!

class ArgParser {
  constructor (cli, config) {
    this._optsList = cli.options || []
    this._cmdsList = cli.commands || []

    this._examples = cli.examples || ''
    this._usage = cli.usage || ''
    const {optHash, defaults} = _makeOptHash(this._optsList)
    this._optsHash = optHash
    this._defaults = defaults

    this.configure(config)
  }

  configure ({errorHandler, reportHelpContent = false, omitDefaultHelpOption = false} = {}) {
    this._errorHandler = errorHandler
    this._reportHelpContent = reportHelpContent
    this._omitDefaultHelpOption = omitDefaultHelpOption
  }

  parse (argv) {
    const program = {}

    if ((argv.length < 3 && !this._cmdsList.some(cmd => cmd.default)) || argv[2] === 'help' || _asOptionName(argv[2], this._optsHash) === 'help') {
      program.command = 'help'
      program.opts = {}
    } else {
      let skipArgs
      let error;
      [ program.command, skipArgs, error ] = _selectCommand(this._cmdsList, argv[2], this._errorHandler)
      if (error) {
        program.error = error
        return program
      }
      const args = argv.slice(2 + skipArgs)
      let opts
      const result = _parseOpts(args, this._optsHash, this._errorHandler)
      opts = result.opts
      error = result.error
      // Write any specified values over the defaults
      program.opts = {...this._defaults, ...opts}
      if (error) {
        program.error = error
      }
    }

    if (program.command === 'help' || program.opts.help) {
      program.helpContent = this.getHelp()
      if (!this._reportHelpContent) {
        console.log(program.helpContent)
        process.exit(0)
      }
    }

    return program
  }

  getHelp () {
    const maxCommandLength = Math.max.apply(null, this._cmdsList.map(cmd => cmd.command).map(c => c.length))
    this._cmdsList.forEach(cmd => {
      cmd.help = '    ' + cmd.command + new Array(maxCommandLength - cmd.command.length + 3).join(' ') + cmd.desc
    })
    const commandHelp = 'Commands:\n\n' + this._cmdsList.map(cmd => cmd.help).join('\n')

    let indent = 0
    this._optsList.forEach(opt => {
      const help = _formatOpt(opt)
      opt.help = help
      indent = Math.max(indent, help.length)
    })
    indent += 2
    this._optsList.forEach(opt => {
      const desc = opt.desc
      opt.help = '    ' + opt.help + new Array(indent - opt.help.length + 1).join(' ') +
                desc + _formatValues(opt, indent)
    })
    return this._usage +
            commandHelp +
            '\n\nOptions:\n' + this._optsList.map(cmd => cmd.help).join('\n') + '\n\n' + this._examples
  }
}

export default ArgParser
