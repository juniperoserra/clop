const path = require('path');
const webpack = require('webpack');

// env will be "dev" or "prod"
module.exports = function (env) {
    return {
        target: 'node',
        node: {
            __dirname: false,
            __filename: false
        },
        context: path.resolve(__dirname, './src'),
        entry: {
            index: ['babel-polyfill', './index.js']
        },
        output: {
            path: path.join(path.resolve(__dirname), 'lib'),
            filename: '[name].js'
        },
        devtool: env === 'dev' ? 'inline-source-map' : 'cheap-module-source-map',
        module: {
            rules: [
                {
                    test: /\.js$/,
                    use: [
                        'babel-loader',
                    ],
                    exclude: /node_modules/
                }
            ],
        }
    }
};