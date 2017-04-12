
import ArgParser from './ArgParser'

export const createArgParser = (cli) => {
    return new ArgParser(cli);
}