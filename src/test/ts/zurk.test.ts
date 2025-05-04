import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { zurk, isZurk, isZurkPromise } from '../../main/ts/zurk.ts'
import type { TSpawnResult } from '../../main/ts/spawn.ts'

describe('zurk()', () => {
  it('sync returns Zurk instance', async () => {
    const result = zurk({ sync: true, cmd: 'echo', args: ['foo']})
    assert.equal(result.toString(), 'foo')
    assert.equal(result.stdout, 'foo\n')
    assert.equal(result.status, 0)
    assert.equal(result.signal, null)
    assert.ok(isZurk(result))
  })

  it('async returns ZurkPromise', async () => {
    const result = zurk({ sync: false, cmd: 'echo', args: ['foo']})
    let _result: TSpawnResult

    result.on('end', data => _result = data)

    assert.equal(result.child, result.ctx.child)
    assert.equal((await result).toString(), 'foo')
    assert.equal((await result).stdout, 'foo\n')
    assert.equal(await result.stdout, 'foo\n')
    assert.equal(await result.status, 0)
    assert.equal(await result.signal, null)
    assert.ok(isZurkPromise(result))
    assert.ok(isZurk(await result))

    // @ts-expect-error should be resolved by now
    assert.equal(_result.stdout, 'foo\n')
  })
})
