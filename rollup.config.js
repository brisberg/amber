'use strict';

import fs from 'fs';
import clear from 'rollup-plugin-clear';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import screeps from 'rollup-plugin-screeps';

let cfg;
const dest = process.env.DEST;
if (!dest) {
  console.log(
      'No destination specified - code will be compiled but not uploaded');
} else {
  const credentials = JSON.parse(fs.readFileSync('./screeps.json'));
  if (!credentials[dest]) {
    throw new Error('Invalid upload destination');
  }
  cfg = credentials[dest];
}

export default {
  input: 'src/behaviors_v2/main.ts',
  output: {file: 'dist/main.js', format: 'cjs', sourcemap: true},

  plugins:
      [
        clear({targets: ['dist']}),
        resolve(),
        commonjs(),
        typescript({tsconfig: './tsconfig.json'}),
        screeps({config: cfg, dryRun: cfg == null}),
      ],
};
