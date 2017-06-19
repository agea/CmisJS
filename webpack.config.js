var webpack = require("webpack");
var path = require('path');

var nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './src/cmis.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'cmis.bundle.js'
  },
  resolve: {
    extensions: ['.ts']
  },
  node: {Buffer: false},
  externals: [nodeExternals()],
  module: {
    loaders: [{
      test: /\.ts$/,
      loader: 'ts-loader'
    }]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin()
  ],
}
