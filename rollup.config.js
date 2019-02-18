import pkg from './package.json';

const outro = `
if (typeof window.L !== 'undefined') {
  Object.keys(exports).forEach(key => {
    if (exports.hasOwnProperty(key)) {
      window.L[key] = exports[key];
    }
  });
}
`

export default {
  input: 'TileGeoJSON.js',
  output: [
    {
      name: pkg.name,
      file: pkg.main,
      format: 'iife',
      sourcemap: true,
      globals: {
        leaflet: 'L',
      },
      outro,
    },
    {
      name: pkg.name,
      file: pkg.module,
      format: 'es',
      sourcemap: true,
    }
  ],
  external: [
    'leaflet',
  ],
};
