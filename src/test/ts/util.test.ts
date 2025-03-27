import * as assert from 'node:assert'
import {describe, it, test} from 'node:test'
import { assign, isStringLiteral, randomId, quote, quotePwsh } from '../../main/ts/util.js'
import tslib from 'tslib'

describe('util', () => {
  it('assign()', () => {
    assert.deepEqual(assign({a: 1}, {b: 2}), {a: 1, b: 2})
    assert.deepEqual(assign({a: 1}, {a: undefined}), {a: 1})
  })

  it('randomId()', () => {
    assert.match(randomId(), /^[\da-z]+$/)
  })

  test('isStringLiteral()', () => {
    const bar = 'baz'
    assert.ok(isStringLiteral``)
    assert.ok(isStringLiteral`foo`)
    assert.ok(isStringLiteral`foo ${bar}`)
    assert.ok(isStringLiteral(tslib.__makeTemplateObject(["git pull --tags --force ", " ", ""], ["git pull --tags --force ", " ", ""]), 'foo', 'bar'))

    assert.ok(!isStringLiteral(''))
    assert.ok(!isStringLiteral('foo'))
    assert.ok(!isStringLiteral(['foo']))
  })

  test('quotePwsh()', () => {
    assert.equal(quotePwsh(''), "''")
    assert.equal(quotePwsh('foo bar\r\nbaz'), "'foo bar\r\nbaz'")
  })

  test('quote()', () => {
    assert.equal(quote(''), "$''")
    assert.equal(quote('foo bar\r\nbaz'), "$'foo bar\\r\\nbaz'")
  })
})
