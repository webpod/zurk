import * as cp from 'node:child_process'
import process from 'node:process'
import EventEmitter from 'node:events'
import { Readable, Writable, Stream, Transform } from 'node:stream'
import { assign, noop, randomId } from './util.js'

export * from './util.js'

export type TSpawnError = any

export type TPushable<T = any> = { push(...args: T[]): number }

export type TJoinable = { join(sep?: string): string }

export type TArrayLike<T> = Iterable<T> & TPushable<T> & TJoinable & { length: number, [i: number]: T | undefined }

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
  abort:    (error: Event, ctx: TSpawnCtxNormalized) => void
  err:      (error: Error, ctx: TSpawnCtxNormalized) => void
  end:      (result: TSpawnResult, ctx: TSpawnCtxNormalized) => void
}

export type TSpawnCtx = Partial<Omit<TSpawnCtxNormalized, 'child'>>

export type TChild = ReturnType<typeof cp.spawn>

export type TInput = string | Buffer | Stream

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
  shell:      string | true | undefined
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
}

export const defaults: TSpawnCtxNormalized = {
  get id()    { return randomId() },
  cmd:        '',
  get cwd()   { return process.cwd() },
  sync:       false,
  args:       [],
  input:      null,
  env:        process.env,
  get ee()    { return new EventEmitter() },
  get ac()    { return global.AbortController && new AbortController() },
  get signal() { return this.ac?.signal },
  on:         {},
  detached:   process.platform !== 'win32',
  shell:      true,
  spawn:      cp.spawn,
  spawnSync:  cp.spawnSync,
  spawnOpts:  {},
  get store() { return createStore() },
  callback:   noop,
  get stdin() { return new VoidWritable() },
  get stdout(){ return new VoidWritable() },
  get stderr(){ return new VoidWritable() },
  stdio:      ['pipe', 'pipe', 'pipe'],
  run:        setImmediate,
}

export const normalizeCtx = (...ctxs: TSpawnCtx[]): TSpawnCtxNormalized => assign({
  ...defaults,
  get signal() { return this.ac?.signal }},
  ...ctxs)

export const processInput = (child: TChild, input?: TInput | null) => {
  if (input && child.stdin && !child.stdin.destroyed) {
    if (input instanceof Stream) {
      input.pipe(child.stdin)
    } else {
      child.stdin.write(input)
      child.stdin.end()
    }
  }
}

export class VoidWritable extends Transform {
  _transform(chunk: any, _: string, cb: (err?: Error) => void) {
    this.emit('data', chunk)
    cb()
  }
}

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

export const toggleListeners = (pos: 'on' | 'off', ee: EventEmitter, on: Partial<TSpawnListeners> = {}) => {
  for (const [name, listener] of Object.entries(on)) {
    ee[pos](name, listener as any)
  }
  if (pos === 'on')
    ee.once('end', () => toggleListeners('off', ee, on))
}

export const createStore = (): TSpawnStore => ({
  stdout: [],
  stderr: [],
  stdall: [],
})

// eslint-disable-next-line sonarjs/cognitive-complexity
export const invoke = (c: TSpawnCtxNormalized): TSpawnCtxNormalized => {
  const now = Date.now()
  const stdio: TSpawnResult['stdio'] = [c.stdin, c.stdout, c.stderr]

  try {
    if (c.sync) {
      toggleListeners('on', c.ee, c.on)
      const opts = buildSpawnOpts(c)
      const result = c.spawnSync(c.cmd, c.args, opts)
      c.ee.emit('start', result, c)
      if (result.stdout.length > 0) {
        c.store.stdout.push(result.stdout)
        c.store.stdall.push(result.stdout)
        c.stdout.write(result.stdout)
        c.ee.emit('stdout', result.stdout, c)
      }
      if (result.stderr.length > 0) {
        c.store.stderr.push(result.stderr)
        c.store.stdall.push(result.stderr)
        c.stderr.write(result.stderr)
        c.ee.emit('stderr', result.stderr, c)
      }
      c.callback(null, c.fulfilled = {
        ...result,
        get stdout() { return c.store.stdout.join('') },
        get stderr() { return c.store.stderr.join('') },
        stdio,
        get stdall() { return c.store.stdall.join('') },
        duration: Date.now() - now,
        ctx:      c
      })
      c.ee.emit('end', c.fulfilled, c)

    } else {
      c.run(() => {
        toggleListeners('on', c.ee, c.on)

        let error: any = null
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
          c.ee.emit('abort', event, c)
        }
        c.child = child

        c.ee.emit('start', child, c)

        opts.signal?.addEventListener('abort', onAbort)
        processInput(child, c.input || c.stdin)

        child.stdout?.on('data', d => {
          c.store.stdout.push(d)
          c.store.stdall.push(d)
          c.ee.emit('stdout', d, c)
        }).pipe(c.stdout)
        child.stderr?.on('data', d => {
          c.store.stderr.push(d)
          c.store.stdall.push(d)
          c.ee.emit('stderr', d, c)
        }).pipe(c.stderr)
        child
          .on('error', (e: any) => {
            error = e
            c.ee.emit('err', error, c)
          })
          .on('close', (status, signal) => {
            c.fulfilled = {
              error,
              status,
              signal,
              get stdout() { return c.store.stdout.join('') },
              get stderr() { return c.store.stderr.join('') },
              get stdall() { return c.store.stdall.join('') },
              stdio:    [c.stdin, c.stdout, c.stderr],
              duration: Date.now() - now,
              ctx:      c
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
      c.fulfilled ={
        error,
        status:   null,
        signal:   null,
        stdout:   '',
        stderr:   '',
        stdall:   '',
        stdio,
        duration: Date.now() - now,
        ctx:      c
      }
    )
    c.ee.emit('err', error, c)
    c.ee.emit('end', c.fulfilled, c)
  }

  return c
}

export const exec = (ctx: TSpawnCtx): TSpawnCtxNormalized => invoke(normalizeCtx(ctx))

// https://2ality.com/2018/05/child-process-streams.html
