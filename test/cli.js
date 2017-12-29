/**
 * Created by sgreenwo on 12/11/16.
 */

const commands = [
  {
    command: 'check',
    desc: 'Check that issues and gecks match by owner and status.'
  }, {
    command: 'importBugs',
    desc: 'Import bug gecks for all users into Jira.'
  }, {
    command: 'issuesClosed',
    desc: 'Display the issues closed by a user over an optionally specified date range.'
  }, {
    command: 'projectWikiText',
    desc: 'Display the wiki text for a project reference in the index.'
  }
]

const options = [
  {
    aliases: ['instance', 'i'],
    args: '<instanceName>',
    desc: 'Name of the Jira instance to use. Defaults to logged-in user\'s instance.',
    values: ['mf', 'DASPerf', 'mdwe']
  }, {
    aliases: ['project', 'p'],
    desc: 'Jira project key, where applicable'
  }, {
    aliases: ['noop', 'n'],
    desc: 'Perform no modifying action, just indicate what would have happened.'
  }, {
    aliases: ['user', 'u'],
    args: '<userName>',
    desc: 'Name of the Jira user. Defaults to logged-in user.'
  }, {
    aliases: ['time', 't'],
    args: 'a[,b]',
    desc: 'Filter by date, date range, or duration'
  }, {
    aliases: ['help', 'h'],
    args: '',
    desc: 'Output: Show this message.'
  }
]

const usage = `
Usage: otter <command> [options]

Otter is the command-line utility for managing the Modeling Framework Otter
development process tooling. For full details see manual.

Manual: http://inside.mathworks.com/wiki/Otter

Support: Contact Simon Greenwold
`

const examples = `
Example:
    TODO.
`

export default {
  commands,
  options,
  usage,
  examples
}
