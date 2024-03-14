const assert = require('node:assert')
const { describe, it } = require('node:test')
const { $ } = require('zurk')

describe('cjs entry', () => {
  it('$ is callable', () => {
    assert.equal(typeof $, 'function')
  })
})
