import assert from 'node:assert'
import { describe, it } from 'node:test'
import { $ } from 'zurk'
import { buildCmd } from 'zurk/util'

describe('mjs entry', () => {
  it('$ is callable', () => {
    assert.equal(typeof $, 'function')
  })
  it('buildCmd is callable', () => {
    assert.equal(typeof buildCmd, 'function')
  })
})
