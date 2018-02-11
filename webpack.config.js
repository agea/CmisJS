const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  entry: './dist/cmis.js',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts']
  },
  output: {
    filename: 'cmis.bundle.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: "umd"
  },
  plugins: [
    new UglifyJsPlugin({
      sourceMap: true
    })
  ],
  externals: [
    'cross-fetch/polyfill',
    'url-search-params-polyfill',
    'node-fetch',
    {
      'isomorphic-form-data': {
        root: 'window',
        commonjs2: "isomorphic-form-data",
        commonjs: "isomorphic-form-data",
        amd: "isomorphic-form-data"
      },
      'isomorphic-base64': {
        root: 'window',
        commonjs2: "isomorphic-base64",
        commonjs: ["isomorphic-base64"],
        amd: "isomorphic-base64"
      }
    }
  ]
};