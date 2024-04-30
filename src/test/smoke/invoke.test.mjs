import assert from 'assert'
import { zurk } from 'zurk'

const result = zurk({ sync: true, cmd: 'echo', args: ['foo'] })
assert.match(result.stdout, /foo/)
assert.equal(result.status, 0)

console.log('smoke mjs: ok')
