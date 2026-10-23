import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { rolldown } from 'rolldown';

export async function productionModule(path) {
  const bundle = await rolldown({
    input: fileURLToPath(new URL(`../../${path}`, import.meta.url)),
    resolve: { alias: { 'pangu/shared': fileURLToPath(new URL('../../src/shared/index.ts', import.meta.url)) } },
  });
  try {
    const { output } = await bundle.generate({ format: 'esm' });
    assert(output.length === 1 && output[0].type === 'chunk', `${path}: expected one production bundle; check the production imports`);
    return await import(`data:text/javascript;base64,${Buffer.from(output[0].code).toString('base64')}`);
  } finally {
    await bundle.close();
  }
}
