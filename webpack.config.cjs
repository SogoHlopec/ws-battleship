const path = require('path');

module.exports = {
  entry: './index.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    library: {
      type: 'commonjs2',
    },
  },
  mode: 'production',
  target: 'node',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(ts|js)?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
};
