'use strict';

import clear from 'rollup-plugin-clear';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import multiEntry from '@rollup/plugin-multi-entry';

export default {
  input: 'test/integration/**/*.test.ts',
  output: {
    file: 'dist/test-integration.bundle.js',
    name: 'lib',
    sourcemap: true,
    format: 'cjs',
    globals: {
      chai: 'chai',
      it: 'it',
      describe: 'describe',
    }
  },
  external: ['chai', 'fs', 'screeps-server-mockup'],
  plugins:
      [
        clear({targets: ['dist/test.bundle.js']}),
        resolve(),
        commonjs(),
        typescript({tsconfig: './tsconfig.json'}),
        multiEntry(),
      ]
}
