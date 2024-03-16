import type { Readable, Writable } from 'node:stream'
import {
  zurk,
  zurkifyPromise,
  isZurkAny,
  TZurk,
  TZurkPromise,
  TZurkOptions,
  TZurkCtx
} from './zurk.js'
import {
  type Promisified,
  type TVoidCallback,
  isPromiseLike,
  isStringLiteral,
  assign,
  quote,
  buildCmd
} from './util.js'
import { pipeMixin } from './mixin/pipe.js'
import { killMixin } from './mixin/kill.js'
import { timeoutMixin } from './mixin/timeout.js'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TShellCtxExtra {
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TShellExtra {
}

export interface TShellOptionsExtra {
  timeout?: number
  timeoutSignal?: NodeJS.Signals
}

export interface TShellResponseExtra<T = any> {
  pipe(shell: T): T
  pipe(steam: Writable): Writable
  pipe(pieces: TemplateStringsArray, ...args: any[]): T
  kill(signal?: NodeJS.Signals | null): Promise<void>
  abort(): void
  timeout?: number
  timeoutSignal?: NodeJS.Signals
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TShellCtx extends TZurkCtx, TShellCtxExtra {
  timer?: number | NodeJS.Timeout
  timeout?: number
  timeoutSignal?: NodeJS.Signals
}

export type TShellOptions = Omit<TZurkOptions, 'input'> & {
  qoute?: TQuote
  input?: TShellCtx['input'] | TShellResponse | TShellResponseSync | null
} & TShellOptionsExtra

export interface TShellResponse extends Omit<Promisified<TZurk>, 'stdio' | 'ctx' | 'child'>, Promise<TZurk & TShellResponseExtra<TShellResponse>>, TShellResponseExtra<TShellResponse> {
  child: TZurk['child']
  stdio: [Readable | Writable, Writable, Writable]
  ctx:  TShellCtx
  on: (event: string | symbol, listener: TVoidCallback) => TShellResponse
}

export interface TShellResponseSync extends TZurk, TShellResponseExtra<TShellResponseSync> {
}

export type TMixin =
  (($: TShell, target: TShellOptions) => TShellOptions | TZurk | TZurkPromise) |
  (($: TShell, target: TZurk, ctx: TShellCtx) => TZurk) |
  (($: TShell, target: Promise<TZurk> | TZurkPromise, ctx: TShellCtx) => TZurkPromise)

export interface TShell extends TShellExtra {
  mixins: TMixin[]
  <O extends void>(this: O, pieces?: TemplateStringsArray, ...args: any[]): TShellResponse
  <O extends TShellOptions = TShellOptions, R = O extends {sync: true} ? TShellResponseSync : TShellResponse>(this: O, pieces?: TemplateStringsArray, ...args: any[]): R
  <O extends TShellOptions = TShellOptions, R = O extends {sync: true} ? TShellSync : TShell>(opts: O): R
}

export interface TShellSync {
  <O>(this: O, pieces?: TemplateStringsArray, ...args: any[]): TShellResponseSync
  (opts: TShellOptions): TShellSync
}

export type TQuote = (input: string) => string

export const $: TShell = function(this: any, pieces?: any, ...args: any): any {
  const preset = this || {}

  if (pieces === undefined) return applyMixins($, preset)

  if (isStringLiteral(pieces)) return ignite(preset, pieces, ...args)

  return (...args: any) => $.apply(this ? assign(this, pieces) : pieces, args)
}

const ignite = (preset: any, pieces: TemplateStringsArray, ...args: any[]) => {
  const cmd = buildCmd(preset.quote || quote, pieces as TemplateStringsArray, args)
  const input = parseInput(preset.input)
  const run = cmd instanceof Promise
    ? (cb: TVoidCallback, ctx: TShellCtx) => cmd.then((cmd) => { ctx.cmd = cmd; cb() })
    : setImmediate
  const opts = assign(preset, { cmd, run, input })

  return applyMixins($, opts)
}

const zurkMixin: TMixin = ($: TShell, target: TShellOptions | TZurk | TZurkPromise | Promise<TZurk>) => {
  if (isZurkAny(target)) return target

  const result: TZurk | TZurkPromise = zurk(target as TZurkOptions)
  return isPromiseLike(result)
    ? zurkifyPromise(
      (result as TZurkPromise).then((r: TZurk) => applyMixins($, r, result)) as Promise<TZurk>,
      result.ctx)
    : result as TZurk
}

$.mixins = [zurkMixin, killMixin, pipeMixin, timeoutMixin]

export const applyMixins = ($: TShell, result: TZurk | TZurkPromise | TShellOptions, parent?: TZurk | TZurkPromise) => {
  let ctx: TShellCtx = (parent as TZurkPromise | TZurk)?.ctx

  return $.mixins.reduce((r, m) => {
    ctx = ctx || (r as TZurkPromise | TZurk).ctx
    return m($, r as any, ctx)
  }, result)
}

export const parseInput = (input: TShellOptions['input']): TShellCtx['input'] => {
  if (typeof (input as TShellResponseSync)?.stdout === 'string') return (input as TShellResponseSync).stdout
  if ((input as TShellResponse)?.ctx) return (input as TShellResponse).ctx.stdout

  return input as TShellCtx['input']
}
