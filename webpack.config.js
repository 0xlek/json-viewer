var path = require("path");
var fs = require('fs-extra');
var webpack = require("webpack");
var { CleanWebpackPlugin } = require("clean-webpack-plugin");
var CopyPlugin = require("copy-webpack-plugin");
var BuildPaths = require("./lib/build-paths");
var BuildExtension = require("./lib/build-extension-webpack-plugin");
var MiniCssExtractPlugin = require("mini-css-extract-plugin");

var manifest = fs.readJSONSync(path.join(BuildPaths.SRC_ROOT, 'manifest.json'));
var version = manifest.version;

var entries = {
  viewer: ["./extension/src/viewer.js"],
  "viewer-alert": ["./extension/styles/viewer-alert.scss"],
  "jq-modal": ["./extension/styles/jq-modal.scss"],
  options: ["./extension/src/options.js"],
  background: ["./extension/src/background.js"],
  "offscreen-jq": ["./extension/src/offscreen-jq.js"],
  "omnibox-page": ["./extension/src/omnibox-page.js"],
  popup: ["./extension/src/popup.js"]
};

function findThemes(darkness) {
  return fs.readdirSync(path.join('extension', 'themes', darkness)).
    filter(function(filename) {
      return /\.js$/.test(filename);
    }).
    map(function(theme) {
      return theme.replace(/\.js$/, '');
    });
}

function includeThemes(darkness, list) {
  list.forEach(function(filename) {
    entries[filename] = ["./extension/themes/" + darkness + "/" + filename + ".js"];
  });
}

var lightThemes = findThemes('light');
var darkThemes = findThemes('dark');
var themes = {light: lightThemes, dark: darkThemes};

includeThemes('light', lightThemes);
includeThemes('dark', darkThemes);

console.log("Entries list:");
console.log(entries);
console.log("\n");

var webpackConfig = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: false,
  target: 'web',
  context: __dirname,
  entry: entries,
  output: {
    path: path.join(__dirname, "build/json_viewer/assets"),
    filename: "[name].js",
    publicPath: '',
    environment: {
      arrowFunction: true,
      const: true
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: { chrome: '88' },
                modules: false
              }]
            ]
          }
        }
      },
      {
        test: /\.(css|scss)$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader'
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.css', '.scss'],
    modules: [path.resolve(__dirname, './extension'), 'node_modules'],
    fallback: {
      "fs": false,
      "path": false,
      "crypto": false
    }
  },
  externals: [
    {
      "chrome-framework": "chrome"
    }
  ],
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: "[name].css"
    }),
    new CopyPlugin({
      patterns: [
        { from: 'node_modules/jq-web/jq.wasm', to: 'jq.wasm' }
      ]
    }),
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
        VERSION: JSON.stringify(version),
        THEMES: JSON.stringify(themes)
      }
    }),
    new BuildExtension({ themes: themes })
  ]
};

if (process.env.NODE_ENV === 'production') {
  webpackConfig.optimization = {
    minimize: true
  };
}

module.exports = webpackConfig;
