const webpack = require('webpack');
const path = require('path');

module.exports = {
  devtool: 'source-map',
  entry: [
    'webpack-hot-middleware/client',
	'babel-polyfill',
  	path.join(__dirname, '/browser/react/index.js')
  ],
  output: {
    path: path.join(__dirname, '/public'),
    filename: 'bundle.js',
    publicPath: '/dev'
  },
  module: {
    loaders: [  	
		{ test:/\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
		{ test:/\.scss$/, loader: 'style-loader!css-loader!sass-loader' }	
    ]
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
  ],
  resolve: {
    alias: {
      app: browserPath(''),
      reducers: browserPath('redux/reducers'),
      components: browserPath('react/components'),
      containers: browserPath('react/containers'),
      colorCSS: browserPath('react/colorCSS'),
      theme: browserPath('react/theme'),
      utils: browserPath('redux/utils'),
      assets: browserPath('assets')
    }
  }
};

function browserPath(txt) {
  return path.join(__dirname, `/browser/${txt}`);
}
