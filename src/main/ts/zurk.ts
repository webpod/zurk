import {
  invoke,
  normalizeCtx,
  asyncVoidCall,
  type TSpawnCtxNormalized,
  type TSpawnResult,
  type TSpawnListeners,
} from './spawn.ts'
import {
  isPromiseLike,
  makeDeferred,
  type Promisified,
  type TVoidCallback
} from './util.ts'
import {
  formatErrorMessage,
  formatExitMessage
} from './error.ts'


/**
 * @module
 *
 * Zurk process spawner
 *
 * @example
 * ```ts
 * import {zurk} from 'zurk/zurk'
 *
 * const r1 = zurk({ sync: true, cmd: 'echo', args: ['foo']})
 * const r2 = await zurk({ sync: false, cmd: 'echo', args: ['foo']})
 * ```
 */

export const ZURK = Symbol('Zurk')
export const ZURKPROXY = Symbol('ZurkProxy')

// TODO infer
export interface TZurkOn<R> {
  on<T extends 'start', L extends TSpawnListeners[T]>(name: T, listener: L): R
  on<T extends 'stdout', L extends TSpawnListeners[T]>(name: T, listener: L): R
  on<T extends 'stderr', L extends TSpawnListeners[T]>(name: T, listener: L): R
  on<T extends 'end', L extends TSpawnListeners[T]>(name: T, listener: L): R
  on<T extends 'err', L extends TSpawnListeners[T]>(name: T, listener: L): R
  on<T extends 'abort', L extends TSpawnListeners[T]>(name: T, listener: L): R
}

export interface TZurk extends TSpawnResult, TZurkOn<TZurk> {
  ctx:  TZurkCtx
}

export type TZurkCtx = TSpawnCtxNormalized & { nothrow?: boolean, nohandle?: boolean }

export type TZurkOptions = Partial<Omit<TZurkCtx, 'callback'>>

export type TZurkPromise = Promise<TZurk> & Promisified<TZurk> & TZurkOn<TZurkPromise> & {
  ctx:  TZurkCtx
  stdio: TZurkCtx['stdio']
  child: TZurkCtx['child']
}

export const zurk = <T extends TZurkOptions = TZurkOptions, R = T extends {sync: true} ? TZurk : TZurkPromise>(opts: T): R =>
  (opts.sync ? zurkSync(opts) : zurkAsync(opts)) as R

export const zurkAsync = (opts: TZurkOptions): TZurkPromise => {
  const { promise, resolve, reject } = makeDeferred<TZurk>()
  const ctx: TZurkCtx = normalizeCtx(opts, {
    sync: false,
    callback(err, data) {
      ctx.error = ctx.nohandle ? err : getError(data)
      ctx.error && !ctx.nothrow ? reject(ctx.error) : resolve(zurkFactory(ctx))
    }
  })

  invoke(ctx)

  return zurkifyPromise(promise, ctx)
}

export const zurkSync = (opts: TZurkOptions): TZurk => {
  let response: TZurk
  const ctx: TZurkCtx = normalizeCtx(opts, {
    sync: true,
    callback(err, data) {
      ctx.error = ctx.nohandle ? err : getError(data)
      if (ctx.error && !ctx.nothrow) throw ctx.error
      response = zurkFactory(ctx)
    }
  })

  invoke(ctx)

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return response as TZurk
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export const zurkifyPromise = (target: Promise<TZurk> | TZurkPromise, ctx: TSpawnCtxNormalized): TZurkPromise => {
  if (isZurkProxy(target) || !isPromiseLike(target))
    return target as TZurkPromise

  const proxy = new Proxy(target, {
    get(target: Promise<TZurk>, p: string | symbol, receiver: any): any {
      if (p === ZURKPROXY || p === ZURK) return p
      if (p === 'then') return target.then.bind(target)
      if (p === 'catch') return target.catch.bind(target)
      if (p === 'finally') return (cb: TVoidCallback) => proxy.then(asyncVoidCall(cb), asyncVoidCall(cb))
      if (p === 'stdio') return ctx.stdio
      if (p === 'ctx') return ctx
      if (p === 'child') return ctx.child
      if (p === 'on') return function (name: string, cb: VoidFunction){ ctx.ee.on(name, cb); return proxy }

      if (p in target) return Reflect.get(target, p, receiver)

      return target.then(v => Reflect.get(v, p, receiver))
    }
  }) as TZurkPromise

  return proxy
}

export const getError = (spawnResult: TSpawnResult): Error | null => {
  if (spawnResult.error)
    return new Error(formatErrorMessage(spawnResult.error, spawnResult.ctx.stack))
  if (spawnResult.status || spawnResult.signal)
    return new Error(formatExitMessage(spawnResult.status, spawnResult.signal, spawnResult.stderr, spawnResult.ctx.stack))

  return null
}

export const isZurkAny = (o: any): o is TZurk | TZurkPromise => o?.[ZURK] === ZURK
export const isZurk = (o: any): o is TZurk => isZurkAny(o) && !(o instanceof Promise)
export const isZurkPromise = (o: any): o is TZurkPromise => isZurkAny(o) && o instanceof Promise
export const isZurkProxy = (value: any): boolean => value?.[ZURKPROXY] === ZURKPROXY

export const zurkFactory = <C extends TSpawnCtxNormalized>(ctx: C): TZurk  => new Zurk(ctx)

class Zurk implements TZurk {
  [ZURK] = ZURK
  ctx:  TZurkCtx
  constructor(ctx: TZurkCtx) {
    this.ctx = ctx
  }
  on(name: string, cb: TVoidCallback): this { this.ctx.ee.on(name, cb); return this }
  get child()   { return this.ctx.child }
  get status()  { return this.ctx.fulfilled?.status ?? null }
  get signal()  { return this.ctx.fulfilled?.signal ?? null }
  get error()   { return this.ctx.error }
  get stderr()  { return this.ctx.fulfilled?.stderr || '' }
  get stdout()  { return this.ctx.fulfilled?.stdout || '' }
  get stdall()  { return this.ctx.fulfilled?.stdall || '' }
  get stdio(): TSpawnResult['stdio'] { return [
    this.ctx.stdin,
    this.ctx.stdout,
    this.ctx.stderr
  ]}
  get duration()  { return this.ctx.fulfilled?.duration ?? 0 }
  toString(){ return this.stdall.trim() }
  valueOf(){ return this.stdall.trim() }
}
