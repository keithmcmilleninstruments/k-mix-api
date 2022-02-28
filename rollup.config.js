import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/kmixapi.js',
  output: {
    // dir: 'dist',
    file: 'dist/kmixapi.js',
    // format: 'es'
    format: 'iife',
    name: 'KMIX'
  },
  plugins: [nodeResolve(), commonjs()]
};