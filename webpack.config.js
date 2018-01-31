const path = require('path');

module.exports = {
  entry: './src/cmis.ts',
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
    library: 'cmis',
    libraryTarget: "window"
  },
  externals: {
    'isomorphic-fetch':{
      root: 'fetch'
    },
    'isomorphic-form-data':{
      root: 'FormData'
    },
    'isomorphic-base64':{
      root: 'btoa'
    },
    'urlsearchparams':{
      root: 'URLSearchParams'
    }
  }
};