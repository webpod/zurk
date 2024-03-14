import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { foo } from '../../main/ts/index.ts'

describe('foo()', () => {
  it('is callable', () => {
    assert.equal(foo(), undefined)
  })
})
