import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { invoke, zurk, $, buildCmd, exec, defaults, isStringLiteral, VoidStream } from '../../main/ts/index.ts'
import * as all from '../../main/ts/index.ts'

describe('index', () => {
  it('has proper exports', () => {
    assert.equal(typeof defaults, 'object')
    assert.equal(typeof $, 'function')
    assert.equal(typeof zurk, 'function')
    assert.equal(typeof exec, 'function')
    assert.equal(typeof invoke, 'function')
    assert.equal(typeof buildCmd, 'function')
    assert.equal(typeof VoidStream, 'function')
    assert.equal(typeof isStringLiteral, 'function')
    assert.equal(Object.keys(all).length, 10)
  })
})
