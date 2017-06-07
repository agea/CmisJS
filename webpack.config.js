var webpack = require("webpack");
var path = require('path');

module.exports = {
  entry: './src/browser.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'cmis.bundle.js'
  },
  resolve: {
    extensions: ['.ts']
  },
  module: {
    loaders: [{
      test: /form-data/,
      loader: 'noop'
    }, {
      test: /\.ts$/,
      loader: 'ts-loader'
    }]
  },
  plugins: [
    // The injection is done here
    new webpack.ProvidePlugin({
      'Promise': 'es6-promise',
      'fetch': 'exports-loader?self.fetch!isomorphic-fetch'
    })
    //,new webpack.optimize.UglifyJsPlugin()
  ],
}
