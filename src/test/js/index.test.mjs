import assert from 'node:assert'
import { describe, it } from 'node:test'
import { $ } from 'zurk'

describe('mjs entry', () => {
  it('$ is callable', () => {
    assert.equal(typeof $, 'function')
  })
})
