import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import EventEmitter from 'node:events'
import {
  exec,
  invoke,
  normalizeCtx,
  TSpawnCtx,
  TSpawnResult,
  TSpawnStore
} from '../../main/ts/spawn.js'
import { makeDeferred } from '../../main/ts/util.js'

describe('invoke()', () => {
  it('calls a given cmd', async () => {
    const results: string[] = []
    const callback: TSpawnCtx['callback'] = (_err, result) => results.push(result.stdout)
    const { promise, resolve, reject } = makeDeferred<TSpawnResult>()

    invoke(normalizeCtx({
      sync: true,
      cmd: 'echo',
      args: ['hello'],
      callback,
    }))

    invoke(normalizeCtx({
      sync: false,
      cmd: 'echo',
      args: ['world'],
      callback(err, result) {
        err ? reject(err) : resolve(result)
      },
    }))

    await promise.then((result) => callback(null, result))

    console.log(results)
  })

  it('supports stdin injection', async () => {
    const {promise, resolve, reject} = makeDeferred<string>()
    const input = '{"name": "world"}'
    invoke(normalizeCtx({
      sync: false,
      input,
      cmd: 'jq',
      args: ['-r', '.name'],
      callback(err, result) {
        err ? reject(err) : resolve(result.stdout)
      }
    }))

    const name = await promise
    assert.equal(name.trim(), 'world')
  })
})

describe('normalizeCtx()', () => {
  it('normalizes ctx', () => {
    const signal = new AbortController().signal
    const cwds = ['a', 'b', 'c']
    const ctx = {
      cmd: 'foo',
      signal,
      get cwd () {
        return cwds.shift() || process.cwd()
      },
    }
    const normalized = normalizeCtx(ctx)
    assert.equal(normalized.cwd, 'a')
    assert.equal(normalized.cwd, 'b')
    assert.equal(normalized.cwd, 'c')
    assert.equal(normalized.signal, signal)
    assert.ok(normalized.ee instanceof EventEmitter)
    assert.ok(normalized.ac instanceof AbortController)
    assert.deepEqual(normalized.store.stdout, [])
    assert.deepEqual(normalized.store.stderr, [])
  })
})

describe('exec()', () => {
  it('supports custom stores', async () => {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const getFixedSizeArray = (size: number) => {
      const arr: any[] = []
      return new Proxy(arr, {
        get: (target: any, prop) =>
          prop === 'push' && arr.length >= size
            ? () => { /* noop */ }
            : target[prop]
      })
    }
    const { promise, resolve, reject } = makeDeferred<TSpawnResult>()
    const callback: TSpawnCtx['callback'] = (err, result) => err ? reject(err) : resolve(result)
    const store: TSpawnStore = {
      stdout: getFixedSizeArray(1),
      stderr: getFixedSizeArray(2),
      stdall: getFixedSizeArray(0),
      getStdout() { return store.stdout.join('')},
      getStderr() { return store.stderr.join('')},
      getStdall() { return store.stdall.join('')},
    }

    const ctx = exec({sync: false, callback, store, cmd: 'echo', args: ['hello']})
    const result = await promise

    assert.equal(ctx.store.getStdall(), '')
    assert.equal(ctx.store.getStdout().trim(), 'hello')
    assert.equal(result.stdout.trim(), 'hello')
    assert.equal(result.stdall, '')
  })
})
