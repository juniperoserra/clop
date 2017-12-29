
import ArgParser from './ArgParser'

export const createArgParser = (cli, config = {}) => {
  return new ArgParser(cli, config)
}
