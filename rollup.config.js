import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const dist = 'dist';

export default {
  input: 'src/kmix-api.js',
  output: [
    {
      file: `${dist}/kmix-api.js`,
      format: 'iife',
      name: 'KMIX'
    },
    {
      file: `${dist}/kmix-api.esm.js`,
      format: 'esm',
      name: 'KMIX'
    },
    {
      file: `${dist}/kmix-api.umd.js`,
      format: 'umd',
      name: 'KMIX'
    }
  ],
  plugins: [nodeResolve(), commonjs()]
};