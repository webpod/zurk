const assert = require('assert')
const { zurk } = require('zurk')

const result = zurk({ sync: true, cmd: 'echo', args: ['foo'] })
assert.match(result.stdout, /foo/)
assert.equal(result.status, 0)

console.log('smoke cjs: ok')
