const Benchmark = require('benchmark');

const pangu = require('../../dist/shared/core');

const suite = new Benchmark.Suite();

// suite
// .add('pangu.spacing()', () => {
//   pangu.spacing('新八的構造成分有95%是眼鏡、3%是水、2%是垃圾');
// })
// .add('panguLegacy.spacing()', () => {
//   panguLegacy.spacing('新八的構造成分有95%是眼鏡、3%是水、2%是垃圾');
// })
// .on('cycle', (event) => {
//   console.log(String(event.target));
// })
// .on('complete', () => {
//   console.log(`Fastest is ${suite.filter('fastest').map('name')}`);
// })
// .run({ async: true });
