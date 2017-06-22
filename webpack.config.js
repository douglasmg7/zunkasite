'use strict';
const path = require('path');
const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const DEVELOPMENT = process.env.NODE_ENV === 'development';

// Trace call for modules deprecated.
process.traceDeprecation = true;

const entry = DEVELOPMENT
  ? {
    bundleProductsStore: ['./webpack/productsStore.js', 'webpack-hot-middleware/client?reload=true'],
    // bundleProductsManual: ['./src/js/productsManual.js', 'webpack-hot-middleware/client?reload=true'],
    bundleProductsAllNations: ['./webpack/productsAllNations.js', 'webpack-hot-middleware/client?reload=true'],
    bundleStore: ['./webpack/store.js', 'webpack-hot-middleware/client?reload=true'],
    bundleStoreItem: ['./webpack/storeItem.js', 'webpack-hot-middleware/client?reload=true']
  }
  : {
    bundleProductsStore: './webpack/productsStore.js',
    // bundleProductsManual: './src/js/productsManual.js',
    bundleProductsAllNations: './webpack/productsAllNations.js',
    bundleStore: './webpack/store.js',
    bundleStoreItem: './webpack/storeItem.js'
  };
// Plugins.
const plugins = DEVELOPMENT
  ? [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  ]
  : [
    new webpack.DefinePlugin({ 'process.env': { NODE_ENV: '"production"'}}),
    new UglifyJSPlugin()
  ];
// Devtool.
const devtool = DEVELOPMENT
  ? '#eval-source-map'
  : 'source-map';
module.exports = {
  // cache: true,
  // devtool: 'source-map',   // for production
  // devtool: '#eval-source-map',
  // devtool: 'eval',   // fast build
  devtool: devtool,
  entry: entry,
  output: {
    path: path.resolve(__dirname, 'dist/'),
    publicPath: '',
    // publicPath: 'dist/',
    filename: '[name].js'
  },
  // uncomment to use standalone build instead run-time only
  // standalone required to use template instead of render
  // single componente can use template with run-time
  resolve: {
    alias: {
      // 'vue$': 'vue/dist/vue.common.js'
      // 'vue$': 'vue/dist/vue.runtime.common.js'
      // 'vue$': 'vue/dist/vue.esm.js'
      'vue$': 'vue/dist/vue.runtime.esm.js'
      // 'vue$': 'vue/dist/vue.min.js'
      // 'vue$': 'vue/dist/vue.runtime.min.js'
    }
  },
  module: {
    rules: [
      // {
      //   test: /\.html$/,
      //   loader: 'vue-template-loader'
      // },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {
            // Since sass-loader (weirdly) has SCSS as its default parse mode, we map
            // the "scss" and "sass" values for the lang attribute to the right configs here.
            // other preprocessors should work out of the box, no loader config like this nessessary.
            'scss': 'vue-style-loader!css-loader!sass-loader',
            'sass': 'vue-style-loader!css-loader!sass-loader?indentedSyntax'
          }
          // other vue-loader options go here
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        loader: ['style-loader', 'css-loader'],
        exclude: /node_modules/
      },
      {
        test: /\.(eot|png|svg|[ot]tf|woff2?)(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url-loader',
        query: {limit: 10000}
      },
      {
        test: /\.(jpg|gif)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]'
        }
      }
    ]
  },
  devServer: {
    historyApiFallback: true,
    noInfo: true
  },
  plugins: plugins
};
