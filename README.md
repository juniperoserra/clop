# Clop (**C**ommand **L**ine **O**ptions **P**arser)

Clop is a utility for parsing commands and arguments for command-line "swiss-army" style programs. These are programs like "git" or "p4" that themselves just gateways to a set of commands with similar options. It also prints out an auto-formatted "help" document.

To use Clop, you supply a "command-line-interface" definition (a "cli") as a plain JavaScript object and ask
clop to create an ArgParser. You then pass the system command line to the ArgParser's "parse" method, which returns
an object specifying the command and the options supplied in a convenient form.

Some nice features of Clop include
* Default commands
* Optional arguments
* Option aliases
* Numeric arguments
* List arguments
* Enumeration arguments
* Argument validators

## Command-line conventions
Clop imposes some opinionated conventions on command line arguments and options.

## Example command line:
For the rest of this README, assume we are making a command-line utility called "tasker" for managing tasks. Here is a sample "tasker" command invocation to create an important cake baking task for user mickey of duration 2 hours:
```
$ tasker add -u mickey -important -hours 2 -d "Bake a cake"
```

## Commands

The first arugment is the "command." If the cli specifies a default command, the command may be omitted. The command is never prefixed with a dash. In the example above, the command is "add." Everything else is options.

## Options

* Option order never matters.
* All options begin with a single dash whether they are abbreviations or not. (Double dashes are permitted but they are converted to single-dashes.)
* Options may have "aliases" which are all considered equivalent. Frequently there will be a long and short (single character) alias.
* Options may or may or may not take arguments
    * Arguments may specify type
    * Arguments can specify if they are multi-valued

## Dashes, underscores, and mixedCase
Because dashes, underscores and mixedCase are all possible ways to specify concatenated terms, they are considered to be the same. Commands are not case-sensitive. TODO: I think this is a lousy idea. I'm going to get rid of it...

## Install

```bash
$ npm install --save clop
```

## Getting Started

At the top of your main program, import or require `clop`:

```javascript
const clop = require('clop'); // es5
```

or 

```javascript
import clop from 'clop'; // es6
```

Create a JavaScript object that contains the description of the interface. The object should have the following structure:

```javascript
const cli = {
    commands: [], // Array of Command objects detailing the names and descriptions of commands
    options: [], // Array of Options objects with their aliases, arguments, defaults and descriptions
    usage: '', // A string documenting basic usage of the program
    examples: '' // A string showing sample usages of the program
}
```

You will usually want to make the cli specification into its own JavaScript module to keep it separate from the rest of the code.

Then create an `ArgParser` object with your cli:

```javascript
const argParser = clop.createArgParser(cli); 
```

At this point the parser can be configured for special cases, but usually it doesn't have to be.
Then parse the command line with the argParser and use the results:

```javascript
const programSpec = argParser.parse(process.argv);
// programSpec.command now contains the "command" the user specified
// programSpec.opts now contains all of the options the user specified
```

## Generating the "help" text

The "help" command or option is something of a special case because its entire function is to print out some text and quit the program. Therefore the `parse` method prints help and exits by default if it determines that the command is really "help." There are several ways that parse may determine that the command is "help."

### Ways to invoke "help"
* Unless a cli specifies a default command, if the user does not specify a command, "parse" will assume that the user needs help.
* By default all parsers add a help option "-help" or "-h" to the cli. If you want to turn it off you need to configure the argParser before calling parse. Therefore by default if "-h" or "-help" appears among any other options, parse will print help text and exit.

```javascript
argParser.configure({ omitDefaultHelpOption: true });
```

Since it is annoying to try to test a system that explictly exits, you can override both the printing and exiting behaviors of parse with the following configuration:

```javascript
argParser.configure({ reportHelpContent: true });
```

If you specify this, in a case where parse invokes help, the programSpec will be returned as follows:

```javascript
{
    command: 'help',
    helpContent: '<The full formatted help content>'
    opts: {<Any other opts specified>}
}
```

## Error handling
In a case where a user makes a mistake like trying to refer to an unknown command or option, the default is to issue an informative error message to the console and exit. If you'd like to override this behavior specify a configuration parameter `errorHandler` as described below in Configuration parameters. 

## Configuration parameters
You can configure an argParser before calling parse by passing in a configuration object to its `configure` method. You can also pass this configuration object in to the `clop.createArgParser(cli, config)` method as an optional second parameter following the cli.

```javascript
const argParser = clop.createArgParser(cli, {<config>});
```
or
```javascript
argParser.configure({<config>});
```

The legal configuration options are

* __`errorHandler`__: A function that will be called with two arguments: a string error ID and full error text instead of having errors reported to the console and the program terminated. If this option is specified but the value is empty or is not a function, the errors will be silently added to the programSpec as an `error` object with string fields `id` and `msg`. Silent erroring is primarily useful for testing.
* __`reportHelpContent`__: Set this to true to return help content rather than report help to the console and exit.

## TODO
Things that don't yet work include
* Command-less programs
* Subcommands
* Per-command help
* Per-command options
* Special "Flag" option type for booleans only

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/juniperoserra/clop/tags). 

## Authors

* **Simon Greenwold** - [Clop](https://github.com/juniperoserra)

See also the list of [contributors](https://github.com/juniperoserra/clop/contributors) who participated in this project.

## License

This project is licensed under the ISC License