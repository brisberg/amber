'use strict';

import clear from 'rollup-plugin-clear';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import multiEntry from '@rollup/plugin-multi-entry';

export default {
  input: 'test/integration/**/*.test.ts',
  output: {
    file: 'lib/test-integration.bundle.js',
    name: 'lib',
    sourcemap: true,
    format: 'cjs',
    globals: {
      it: 'it',
      describe: 'describe',
    },
  },
  external: ['fs', '@brisberg/screeps-server-mockup'],
  plugins:
      [
        clear({targets: ['lib/test.bundle.js']}),
        resolve(),
        commonjs(),
        typescript({tsconfig: './tsconfig.json'}),
        multiEntry(),
      ],
};
