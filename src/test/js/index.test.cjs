const assert = require('node:assert')
const { describe, it } = require('node:test')
const { foo } = require('@antongolub/blank-ts')

describe('cjs foo()', () => {
  it('is callable', () => {
    assert.equal(foo(), undefined)
  })
})
