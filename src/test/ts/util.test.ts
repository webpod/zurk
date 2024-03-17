import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { assign } from '../../main/ts/util.js'

describe('util', () => {
  it('assign()', () => {
    assert.deepEqual(assign({a: 1}, {b: 2}), {a: 1, b: 2})
    assert.deepEqual(assign({a: 1}, {a: undefined}), {a: 1})
  })
})
