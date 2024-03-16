const assert = require('node:assert')
const { describe, it } = require('node:test')
const { $ } = require('zurk')
const { buildCmd } = require('zurk/util')

describe('cjs entry', () => {
  it('$ is callable', () => {
    assert.equal(typeof $, 'function')
  })
  it('buildCmd is callable', () => {
    assert.equal(typeof buildCmd, 'function')
  })
})
