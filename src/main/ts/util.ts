import { Stream } from 'node:stream'
import process from 'node:process'
import { Buffer } from 'node:buffer'

/**
 * @module
 *
 * Zurk utility functions
 *
 * @example
 * ```ts
 * import {randomId} from 'zurk/util'
 *
 * randomId() // 'kdrx9bngrb'
 * ```
 */

export const g = (!process.versions.deno && global) || globalThis

export const immediate = g.setImmediate || ((f: any): NodeJS.Timeout => g.setTimeout(f, 0))

export const noop = () => { /* noop */ }

export const asyncVoidCall = (cb: TVoidCallback)=> async (): Promise<void> => { await cb() }

export const randomId = (): string => Math.random().toString(36).slice(2)

export type PromiseResolve<T = any> = (value: T | PromiseLike<T>) => void

export type TVoidCallback = (...any: any) => void

// https://stackoverflow.com/questions/47423241/replace-fields-types-in-interfaces-to-promises
export type Promisified<T> = {
  [K in keyof T]: T[K] extends (...args: any) => infer R
    ? (...args: Parameters<T[K]>) => Promise<R>
    : Promise<T[K]>
}

export const makeDeferred = <T = any, E = any>(): { promise: Promise<T>, resolve: PromiseResolve<T>, reject: PromiseResolve<E> } => {
  let resolve
  let reject
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { resolve, reject, promise } as any
}

export const isPromiseLike = (value: any): boolean => typeof value?.then === 'function'

export const isStringLiteral = (
  pieces: any,
  ...rest: any[]
): pieces is TemplateStringsArray =>
  pieces?.length > 0 &&
  pieces.raw?.length === pieces.length &&
  // Object.isFrozen(pieces) &&
  rest.length + 1 === pieces.length

export const assign = <T, E>(target: T, ...extras: E[]): T =>
  Object.defineProperties(target, extras.reduce<Record<string, any>>((m: any, extra) =>
    ({...m, ...Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(extra))
        .filter(([,v]) => !Object.prototype.hasOwnProperty.call(v, 'value') || v.value !== undefined))}), {}))

export const quote = (arg: string): string => {
  if (arg === '') return `$''`
  if (/^[\w./:=@-]+$/.test(arg)) return arg

  return (
    `$'` +
    arg
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, "\\\"")
      .replace(/\f/g, '\\f')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/\v/g, '\\v')
      .replace(/\0/g, '\\0') +
    `'`
  )
}

export function quotePwsh(arg: string): string {
  if (arg === '') return `''`
  if (/^[\w./-]+$/.test(arg)) return arg

  return `'` + arg.replace(/'/g, "''") + `'`
}

export type TQuote = (input: string) => string

export const buildCmd = (quote: TQuote, pieces: TemplateStringsArray, args: any[], subs = substitute): string | Promise<string> =>  {
  if (args.some(isPromiseLike))
    return Promise.all(args).then((args) => buildCmd(quote, pieces, args))

  let cmd = pieces[0], i = 0
  while (i < args.length) {
    const s = Array.isArray(args[i])
      ? args[i].map((x: any) => quote(subs(x))).join(' ')
      : quote(subs(args[i]))

    cmd += s + pieces[++i]
  }

  return cmd
}

export type TSubstitute = (arg: any) => string

export const substitute: TSubstitute = (arg: any) =>
  (typeof arg?.stdout === 'string')
    ? arg.stdout.replace(/\n$/, '')
    : `${arg}`

export const parseInput = (input: any): string | Buffer | Stream | null => {
  if (typeof input === 'string' || input instanceof Buffer || input instanceof Stream) return input

  if (typeof input?.stdout === 'string') return input.stdout

  if (input?.ctx) return parseInput(input.ctx.stdout)

  return null
}

export const pFinally = (p: Promise<any>, cb: TVoidCallback): Promise<void> => p.finally?.(asyncVoidCall(cb)) || p.then(asyncVoidCall(cb), asyncVoidCall(cb))
