import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { invoke, zurk, $, buildCmd, exec, defaults } from '../../main/ts/index.js'

describe('index', () => {
  it('has proper exports', () => {
    assert.equal(typeof defaults, 'object')
    assert.equal(typeof $, 'function')
    assert.equal(typeof zurk, 'function')
    assert.equal(typeof exec, 'function')
    assert.equal(typeof invoke, 'function')
    assert.equal(typeof buildCmd, 'function')
  })
})
