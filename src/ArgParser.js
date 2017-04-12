/**
 * Created by sgreenwo on 12/11/16.
 */

const chalk = require('chalk');

// TODO: parameterize utils
const util = {};
util.assert = function(condition, msg) {
    if (!condition) {
        throw new Error('Assertion: ' + msg);
    }
};

util.assertAlways = function(msg) {
    throw new Error('Assertion: ' + msg);
};

util.errorAssertNoStack = function(condition, type, msg) {
    if (!condition) {
        util.assert(type && msg, 'Must error with both message type and message content');
        console.log(chalk.red('ERROR: ' + msg));
        process.exit(1);
    }
};

function _isString(s) {
    return typeof s === 'string' || s instanceof String;
}

function _isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function _dashToUnderscore(word) {
    return word.replace(/-/g, '_');
}

function _underscoreToCamel(word) {
    return word.replace(/(_[a-z])/g, low => low[1].toUpperCase());
}

function _camelToUnderscore(word) {
    return word.replace(/([A-Z])/g, cap => '_' + cap.toLowerCase());
}

function _scrubOpt(arg) {
    return _underscoreToCamel(_dashToUnderscore(arg));
}

function _makeOptHash(optionsSpec) {
    const optHash = {};
    optionsSpec.forEach(opt => {
        const argName = opt.optName || _scrubOpt(opt.aliases[0]);
        opt.aliases.forEach(alias => {
            alias = _scrubOpt(alias);
            util.assert(!optHash[alias], 'Redundant option alias: ' + alias);
            optHash[alias] = { name: argName, values: opt.values };
        });
    });
    return optHash;
}

function _asOption(arg, optHash) {
    if (!arg || !_isString(arg)) {
        return undefined;
    }
    arg = arg.trim();
    if (arg[0] === '-') {
        arg = arg.replace(/^-+/, '');
    }
    else {
        return undefined;
    }
    arg = _scrubOpt(arg);
    const optData = optHash[arg];
    if (!optData) {
        return undefined;
    }

    return optData.name;
}

function normalizeCmd(input) {
    return _underscoreToCamel(_dashToUnderscore(input)).toLowerCase();
}

function _conditionalProduceError(cond, id, msg, errorHandler) {
    if (cond) {
        return;
    }
    
    if (errorHandler) {
        errorHandler(id, msg);
    }
    else {
        util.errorAssertNoStack(false, id, msg);
    }

    return {id, msg};;
}

function _selectCommand(cmdList, arg, errorHandler) {
    arg = arg || '';
    let skipArgs = 1;
    let command = arg;
    for (let cmd of cmdList) {
        cmd.normalized = normalizeCmd(cmd.command);
    }

    let cmdObj = undefined;
    if (!command || command[0] === '_') {
        cmdObj = cmdList.find(cmd => cmd.default);
        skipArgs = 0;
    } else {
        cmdObj = cmdList.find(cmd => cmd.normalized === normalizeCmd(command));
    }

    const error = _conditionalProduceError(
        cmdObj, 
        'Unknown command', 
        `Unknown command "${arg}"\nPossible commands: ${cmdList.map(cmd => cmd.command).join(', ')}`,
        errorHandler );
    return [ cmdObj ? cmdObj.command : undefined, skipArgs, error ];
}

function _optDone(opts, opt, args) {
    if (!opt && args.length === 0) {
        return;
    }
    if (opt) {
        if (args.length === 0) { // Maybe check for legality of bool?
            opts[opt] = true;
        }
        else {
            let fullArray = [];
            args.forEach(arg => {
                arg.split(',').forEach(element => {
                    if (_isNumeric(element)) {
                        element = parseInt(element, 10);
                    }
                    fullArray.push(element);
                });
            });
            if (fullArray.length === 1) {
                fullArray = fullArray[0];
            }
            opts[opt] = fullArray;
        }
    }
}

function _parseOpts(args, optsHash, errorHandler) {
    const opts = {};
    let error;
    let currentOpt = null;
    let currentOptArgs = [];
    if (args) {
        args.forEach(arg => {
            const nextOpt = _asOption(arg, optsHash);
            if (nextOpt) {
                _optDone(opts, currentOpt, currentOptArgs);
                currentOpt = nextOpt;
                currentOptArgs = [];
            }
            else {
                error = _conditionalProduceError(
                    arg[0] !== '-' && currentOpt,
                    'Unknown option',
                    'Unknown option "' + arg + '"',
                    errorHandler
                );
                currentOptArgs.push(arg);
            }
        });
    }
    _optDone(opts, currentOpt, currentOptArgs);
    return [opts, error];
}

function _formatAliases(aliases) {
    const sortedAliases = aliases.slice(0); // Clone the array since sort is modifying
    return sortedAliases.sort((a, b) => a.length > b.length).map(alias => {
        return '-' + alias;
    }).join(', ');
}

function _formatOpt(opt) {
    let str = _formatAliases(opt.aliases);
    if (opt.args) {
        str = str + ' ' + opt.args;
    }
    return str;
}

function _formatValues(opt) {
    let str = '';
    if (opt.values) {
        str = ' ';
        str = str + '[' + opt.values.join(', ') + ']';
    }
    return str;
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

    constructor(cli) {
        this._optsList = cli.options || [];
        this._cmdsList = cli.commands || [];

        this._examples = cli.examples || '';
        this._usage = cli.usage || '';
        this._optsHash = _makeOptHash(this._optsList);
    }

    configure({errorHandler, reportHelpContent = false, omitDefaultHelpOption = false} = {}) {
        this._errorHandler = errorHandler;
        this._reportHelpContent = reportHelpContent;
        this._omitDefaultHelpOption = omitDefaultHelpOption;
    }

    validateValue(optionName, value) {
        const opt = this._optsHash[optionName];
        util.assert(opt, 'Unknown option "' + optionName + '"');
        const negated = (/^(no-|~|!)/).test(value.trim());
        if (opt.values) {
            const bareValue = value.trim().replace(/^(no-|~|!)/, '').toLowerCase();
            for (let i = 0; i < opt.values.length; i++) {
                const matchValue = opt.values[i];
                if (matchValue.toLowerCase() === bareValue) {
                    return (negated ? '!' : '') + matchValue;
                }
            }
            util.assertAlways('Value "' + value + '" not valid for option "' + optionName +
                '." Allowed values are ' + opt.values);
        }
        return value.trim();
    }

    parse(argv, continueAfterHelp) {
        const program = {};

        if ((argv.length < 3 && !this._cmdsList.some(cmd => cmd.default)) || argv[2] === 'help' || _asOption(argv[2], this._optsHash) === 'help') {
            this.showHelp(continueAfterHelp);
            program.command = 'help';
            program.opts = {};
        }
        else {
            let skipArgs;
            let err;
            [ program.command, skipArgs, err ] = _selectCommand(this._cmdsList, argv[2], this._errorHandler);
            if (err) {
                program.error = err;
                return program;
            }
            const args = argv.slice(2 + skipArgs);
            [ program.opts, err ] = _parseOpts(args, this._optsHash, this._errorHandler);
            if (err) {
                program.error = err;
            }
        }
        return program;
    }

    getHelp() {
        const maxCommandLength = Math.max.apply(null, this._cmdsList.map(cmd => cmd.command).map(c => c.length));
        this._cmdsList.forEach(cmd => {
            cmd.help = '    ' + cmd.command + new Array(maxCommandLength - cmd.command.length + 3).join(' ') + cmd.desc;
        });
        const commandHelp = 'Commands:\n\n' + this._cmdsList.map(cmd => cmd.help).join('\n');

        let indent = 0;
        this._optsList.forEach(opt => {
            const help = _formatOpt(opt);
            opt.help = help;
            indent = Math.max(indent, help.length);
        });
        indent += 2;
        this._optsList.forEach(opt => {
            const desc = opt.desc;
            opt.help = '    ' + opt.help + new Array(indent - opt.help.length + 1).join(' ') +
                desc + _formatValues(opt, indent);
        });
        return this._usage +
            commandHelp +
            '\n\nOptions:\n' + this._optsList.map(cmd => cmd.help).join('\n') + '\n\n' + this._examples;
    }

    showHelp(continueAfterHelp) {
        const helpStr = this.getHelp();
        console.log(helpStr);
        if (!continueAfterHelp) {
            process.exit(0);
        }
    }

}

export default ArgParser;
