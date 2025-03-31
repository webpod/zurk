import type { Readable, Writable } from 'node:stream'
import {
  zurk,
  zurkifyPromise,
  isZurkAny,
  TZurk,
  TZurkPromise,
  TZurkOptions,
  TZurkCtx
} from './zurk.ts'
import {
  type Promisified,
  type TVoidCallback,
  type TQuote,
  isPromiseLike,
  isStringLiteral,
  assign,
  quote,
  buildCmd,
  parseInput,
  g,
  immediate
} from './util.ts'
import { getCallerLocation } from './error.ts'
import { pipeMixin } from './mixin/pipe.ts'
import { killMixin } from './mixin/kill.ts'
import { timeoutMixin } from './mixin/timeout.ts'


/**
 * @module
 *
 * Zurk $ API
 *
 * @example
 * ```ts
 * import {$} from 'zurk/x'
 *
 * const p = await $`echo foo`'
 * ```
 */

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
  pipe(stream: Writable): Writable
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
  quote?: TQuote
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

/**
 * Zurk $ template API
 *
 * @param pieces
 * @param args
 */
export const $: TShell = function(this: any, pieces?: any, ...args: any): any {
  const self =  (this !== g) && this
  const preset = self || {}
  preset.stack = (preset.stack || getCallerLocation())

  if (pieces === undefined) return applyMixins($, preset)

  if (isStringLiteral(pieces, ...args)) return ignite(preset, pieces, ...args)

  return (...args: any) => $.apply(self ? assign(self, pieces) : pieces, args)
}

const ignite = (preset: any, pieces: TemplateStringsArray, ...args: any[]) => {
  const _quote = preset.quote || (preset.shell === false ? (arg: string) => arg : quote)
  const cmd = buildCmd(_quote, pieces as TemplateStringsArray, args)
  const input = parseInput(preset.input)
  const run = cmd instanceof Promise
    ? (cb: TVoidCallback, ctx: TShellCtx) => cmd.then((cmd) => { ctx.cmd = cmd; cb() })
    : immediate
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

/**
 * Applies mixins to the result.
 * @param $
 * @param result
 * @param parent
 * @returns TZurk | TZurkPromise | TShellOptions
 */
export const applyMixins = ($: TShell, result: TZurk | TZurkPromise | TShellOptions, parent?: TZurk | TZurkPromise): TZurk | TZurkPromise | TShellOptions => {
  let ctx: TShellCtx = (parent as TZurkPromise | TZurk)?.ctx

  return $.mixins.reduce((r, m) => {
    ctx = ctx || (r as TZurkPromise | TZurk).ctx
    return m($, r as any, ctx)
  }, result)
}
