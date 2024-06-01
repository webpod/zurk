import assert from 'assert'
import { zurk, $ } from '../../../target/esm/index.mjs'

const keepAlive = setInterval(() => {}, 1000 * 60 * 60)

const r1 = zurk({ sync: true, cmd: 'echo', args: ['foo'] })
assert.ok(/foo/.test(r1.stdout))
assert.equal(r1.status, 0)

const r2 = $({sync: true})`echo bar`
assert.ok(/bar/.test(r2.stdout))
assert.equal(r2.status, 0);

$`echo baz`
  .then((r3) => {
    clearInterval(keepAlive)
    assert.ok(/baz/.test(r3.stdout))
    assert.equal(r3.status, 0)
  })

console.log('nodejs:', process.versions.node)
console.log('smoke mjs: ok')
