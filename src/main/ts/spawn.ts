import * as cp from 'node:child_process'
import process from 'node:process'
import EventEmitter from 'node:events'
import { Buffer } from 'node:buffer'
import { Readable, Writable, Transform } from 'node:stream'
import { assign, noop, randomId, g, immediate } from './util.ts'

/**
 * @module
 *
 * Zurk internal child_process caller API
 *
 * @example
 * ```ts
 * import {invoke, normalizeCtx, TSpawnCtx} from 'zurk/spawn'
 *
 * const results: string[] = []
 * const callback: TSpawnCtx['callback'] = (_err, result) => results.push(result.stdout)
 *
 * invoke(normalizeCtx({
 *   sync: true,
 *   cmd: 'echo',
 *   args: ['hello'],
 *   callback,
 * }))
 * ```
 */

export * from './util.ts'

export type TSpawnError = any

export type TPushable<T = any> = { push(...args: T[]): number }

export type TJoinable = { join(sep?: string): string }

export type TReducible<T, R> = { reduce<U>(fn: (acc: U, cur: T, i: number, arr: T[]) => U, init: U): R }

export type TArrayLike<T> = Iterable<T> & TPushable<T> & TJoinable & TReducible<T, any> &{ length: number, [i: number]: T | undefined }

export type TSpawnStoreChunks = TArrayLike<string| Buffer>

export type TSpawnStore = {
  stdout: TSpawnStoreChunks
  stderr: TSpawnStoreChunks
  stdall: TSpawnStoreChunks
}

export type TSpawnResult = {
  stderr:   string
  stdout:   string
  stdall:   string,
  stdio:    [Readable | Writable, Writable, Writable]
  status:   number | null
  signal:   NodeJS.Signals | null
  duration: number
  ctx:      TSpawnCtxNormalized
  error?:   TSpawnError,
  child?:   TChild
}

export type TSpawnListeners = {
  start:    (data: TChild, ctx: TSpawnCtxNormalized) => void
  stdout:   (data: Buffer, ctx: TSpawnCtxNormalized) => void
  stderr:   (data: Buffer, ctx: TSpawnCtxNormalized) => void
  stdall:   (data: Buffer, ctx: TSpawnCtxNormalized) => void
  abort:    (error: Event, ctx: TSpawnCtxNormalized) => void
  err:      (error: Error, ctx: TSpawnCtxNormalized) => void
  end:      (result: TSpawnResult, ctx: TSpawnCtxNormalized) => void
}

export type TSpawnCtx = Partial<Omit<TSpawnCtxNormalized, 'child'>>

export type TChild = ReturnType<typeof cp.spawn>

export type TInput = string | Buffer | Readable

export interface TSpawnCtxNormalized {
  id:         string,
  cwd:        string
  cmd:        string
  sync:       boolean
  args:       ReadonlyArray<string>
  input:      TInput | null
  stdio:      cp.StdioOptions
  detached:   boolean
  env:        Record<string, string | undefined>
  ee:         EventEmitter
  on:         Partial<TSpawnListeners>
  ac:         AbortController
  signal:     AbortController['signal']
  shell:      string | boolean | undefined
  spawn:      typeof cp.spawn
  spawnSync:  typeof cp.spawnSync
  spawnOpts:  Record<string, any>
  store:      TSpawnStore
  callback:   (err: TSpawnError, result: TSpawnResult) => void
  stdin:      Readable
  stdout:     Writable
  stderr:     Writable
  child?:     TChild
  fulfilled?: TSpawnResult
  error?:     any
  run:        (cb: () => void, ctx: TSpawnCtxNormalized) => void
  stack:      string
}

/**
 * zurk default settings
 */
export const defaults: TSpawnCtxNormalized = {
  get id()    { return randomId() },
  cmd:        '',
  get cwd()   { return process.cwd() },
  sync:       false,
  args:       [],
  input:      null,
  env:        process.env,
  get ee()    { return new EventEmitter() },
  get ac()    { return g.AbortController && new AbortController() },
  get signal() { return this.ac?.signal },
  on:         {},
  detached:   process.platform !== 'win32',
  shell:      true,
  spawn:      cp.spawn,
  spawnSync:  cp.spawnSync,
  spawnOpts:  {},
  get store() { return createStore() },
  callback:   noop,
  get stdin() { return new VoidStream() },
  get stdout(){ return new VoidStream() },
  get stderr(){ return new VoidStream() },
  stdio:      ['pipe', 'pipe', 'pipe'],
  run:        immediate,
  stack:      ''
}

/**
 * Normalizes spawn context.
 *
 * @param ctxs Contexts to normalize
 * @returns
 */
export const normalizeCtx = (...ctxs: TSpawnCtx[]): TSpawnCtxNormalized =>
  assign(
    {...defaults},
    { get signal() { return (this as TSpawnCtx).ac?.signal }},
    ...ctxs)

/**
 * Redirects input to child process stdin
 * @param child
 * @param input
 */
export const processInput = (child: TChild, input?: TInput | null): void => {
  if (input && child.stdin && !child.stdin.destroyed) {
    if (input instanceof Readable) {
      input.pipe(child.stdin)
    } else {
      child.stdin.write(input)
      child.stdin.end()
    }
  }
}

/**
 * Transformer that emits data but does not consume it.
 */
export class VoidStream extends Transform {
  _transform(chunk: any, _: string, cb: (err?: Error) => void) {
    this.emit('data', chunk)
    cb()
  }
}

/**
 * Builds spawn options
 * @param ctx
 * @returns spawn options
 */
export const buildSpawnOpts = ({spawnOpts, stdio, cwd, shell, input, env, detached, signal}: TSpawnCtxNormalized) => ({
  ...spawnOpts,
  env,
  cwd,
  stdio,
  shell,
  input: input as string | Buffer,
  windowsHide: true,
  detached,
  signal
})

/**
 * Toggles event listeners
 * @param pos 'on' | 'off'
 * @param ee EventEmitter
 * @param on listeners map
 */
export const toggleListeners = (pos: 'on' | 'off', ee: EventEmitter, on: Partial<TSpawnListeners> = {}): void => {
  for (const [name, listener] of Object.entries(on)) {
    ee[pos](name, listener as any)
  }
  if (pos === 'on')
    ee.once('end', () => toggleListeners('off', ee, on))
}

/**
 * Creates a new spawn store
 */
export const createStore = (): TSpawnStore => ({
  stdout: [],
  stderr: [],
  stdall: [],
})

/**
 * Invokes a child process
 * @param c Normalized context.
 * @returns Normalized context.
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
export const invoke = (c: TSpawnCtxNormalized): TSpawnCtxNormalized => {
  const now = Date.now()
  const stdio: TSpawnResult['stdio'] = [c.stdin, c.stdout, c.stderr]
  const push = (kind: 'stdout' | 'stderr', data: Buffer) => {
    c.store[kind].push(data)
    c.store.stdall.push(data)
    c.ee.emit(kind, data, c)
    c.ee.emit('stdall', data, c)
  }

  try {
    if (c.sync) {
      toggleListeners('on', c.ee, c.on)
      const opts = buildSpawnOpts(c)
      const r = c.spawnSync(c.cmd, c.args, opts)
      c.ee.emit('start', r, c)
      if (r.stdout?.length > 0) {
        c.stdout.write(r.stdout)
        push('stdout', r.stdout)
      }
      if (r.stderr?.length > 0) {
        c.stderr.write(r.stderr)
        push('stderr', r.stderr)
      }
      c.callback(null, c.fulfilled = {
        ...r,
        get stdout() { return c.store.stdout.join('') },
        get stderr() { return c.store.stderr.join('') },
        get stdall() { return c.store.stdall.join('') },
        stdio,
        duration: Date.now() - now,
        ctx: c
      })
      c.ee.emit('end', c.fulfilled, c)

    } else {
      c.run(() => {
        toggleListeners('on', c.ee, c.on)

        let error: any = null
        let aborted = false
        const opts = buildSpawnOpts(c)
        const child = c.spawn(c.cmd, c.args, opts)
        const onAbort = (event: any) => {
          if (opts.detached && child.pid) {
            try {
              // https://github.com/nodejs/node/issues/51766
              process.kill(-child.pid)
            } catch {
              child.kill()
            }
          }
          aborted = true
          c.ee.emit('abort', event, c)
        }
        c.child = child
        c.ee.emit('start', child, c)

        opts.signal?.addEventListener('abort', onAbort)
        processInput(child, c.input || c.stdin)

        child.stdout?.on('data', d => { push('stdout', d) }).pipe(c.stdout)
        child.stderr?.on('data', d => { push('stderr', d) }).pipe(c.stderr)
        child
          .once('error', (e: any) => {
            error = e
            c.ee.emit('err', error, c)
          })
          .once('exit', () => {
            if (aborted) {
              child.stdout?.destroy()
              child.stderr?.destroy()
            }
          })
          .once('close', (status, signal) => {
            c.fulfilled = {
              error,
              status,
              signal,
              get stdout() { return c.store.stdout.join('') },
              get stderr() { return c.store.stderr.join('') },
              get stdall() { return c.store.stdall.join('') },
              stdio,
              duration: Date.now() - now,
              ctx: c
            }
            opts.signal?.removeEventListener('abort', onAbort)
            c.callback(error, c.fulfilled)
            c.ee.emit('end', c.fulfilled, c)
          })
      }, c)
    }
  } catch (error: unknown) {
    c.callback(
      error,
      c.fulfilled = {
        error,
        status: null,
        signal: null,
        stdout: '',
        stderr: '',
        stdall: '',
        stdio,
        duration: Date.now() - now,
        ctx: c
      }
    )
    c.ee.emit('err', error, c)
    c.ee.emit('end', c.fulfilled, c)
  }

  return c
}

/**
 * Executes a child process
 * @param ctx TSpawnCtx
 * @returns TSpawnCtxNormalized
 */
export const exec = (ctx: TSpawnCtx): TSpawnCtxNormalized => invoke(normalizeCtx(ctx))

// https://2ality.com/2018/05/child-process-streams.html
