const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  entry: './src/polyfills.js',
  resolve: {
    extensions: ['.js']
  },
  plugins: [
    new UglifyJsPlugin()
  ],
  output: {
    filename: 'cmis.polyfills.js',
    path: path.resolve(__dirname, 'dist'),
  }
};