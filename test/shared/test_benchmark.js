const Benchmark = require('benchmark');

const Pangu = require('../../dist/shared/core').Pangu;

const suite = new Benchmark.Suite();
const pangu = new Pangu();

suite
.add('pangu.spacing()', () => {
  pangu.spacing('新八的構造成分有95%是眼鏡、3%是水、2%是垃圾');
})
// .add('panguLegacy.spacing()', () => {
//   panguLegacy.spacing('新八的構造成分有95%是眼鏡、3%是水、2%是垃圾');
// })
.on('cycle', (event) => {
  console.log(String(event.target));
})
.on('complete', () => {
  console.log(`Fastest is ${suite.filter('fastest').map('name')}`);
})
.run({ async: true });
