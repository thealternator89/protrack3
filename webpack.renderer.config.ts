import type { Configuration } from 'webpack';
import * as path from 'path';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

export const rendererConfig: Configuration = {
  module: {
    rules: [
      ...rules.filter((rule) => {
        if (typeof rule === 'object' && rule.use) {
          const use = rule.use;
          if (typeof use === 'object' && 'loader' in use) {
            // Exclude loaders that use __dirname or are for native modules in the renderer
            if (use.loader === '@vercel/webpack-asset-relocator-loader' || use.loader === 'node-loader') {
              return false;
            }
          }
        }
        return true;
      }),
      {
        test: /\.css$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
      },
    ],
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    alias: {
      '@assets': path.resolve(process.cwd(), 'assets'),
    },
  },
  target: 'web',
};
