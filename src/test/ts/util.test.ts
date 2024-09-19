import * as assert from 'node:assert'
import {describe, it, test} from 'node:test'
import { assign, isStringLiteral } from '../../main/ts/util.js'

describe('util', () => {
  it('assign()', () => {
    assert.deepEqual(assign({a: 1}, {b: 2}), {a: 1, b: 2})
    assert.deepEqual(assign({a: 1}, {a: undefined}), {a: 1})
  })

  test('isStringLiteral()', () => {
    const bar = 'baz'
    assert.ok(isStringLiteral``)
    assert.ok(isStringLiteral`foo`)
    assert.ok(isStringLiteral`foo ${bar}`)

    assert.ok(!isStringLiteral(''))
    assert.ok(!isStringLiteral('foo'))
    assert.ok(!isStringLiteral(['foo']))
  })
})
