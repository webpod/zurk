import type { Readable, Writable } from 'node:stream';
import { TZurk, TZurkPromise, TZurkOptions, TZurkCtx } from './zurk.js';
import { type Promisified, type TVoidCallback, type TQuote } from './util.js';
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
export interface TShellCtxExtra {
}
export interface TShellExtra {
}
export interface TShellOptionsExtra {
    timeout?: number;
    timeoutSignal?: NodeJS.Signals;
}
export interface TShellResponseExtra<T = any> {
    pipe(shell: T): T;
    pipe(stream: Writable): Writable;
    pipe(pieces: TemplateStringsArray, ...args: any[]): T;
    kill(signal?: NodeJS.Signals | null): Promise<void>;
    abort(): void;
    timeout?: number;
    timeoutSignal?: NodeJS.Signals;
}
export interface TShellCtx extends TZurkCtx, TShellCtxExtra {
    timer?: number | NodeJS.Timeout;
    timeout?: number;
    timeoutSignal?: NodeJS.Signals;
}
export type TShellOptions = Omit<TZurkOptions, 'input'> & {
    quote?: TQuote;
    input?: TShellCtx['input'] | TShellResponse | TShellResponseSync | null;
} & TShellOptionsExtra;
export interface TShellResponse extends Omit<Promisified<TZurk>, 'stdio' | 'ctx' | 'child'>, Promise<TZurk & TShellResponseExtra<TShellResponse>>, TShellResponseExtra<TShellResponse> {
    child: TZurk['child'];
    stdio: [Readable | Writable, Writable, Writable];
    ctx: TShellCtx;
    on: (event: string | symbol, listener: TVoidCallback) => TShellResponse;
}
export interface TShellResponseSync extends TZurk, TShellResponseExtra<TShellResponseSync> {
}
export type TMixin = (($: TShell, target: TShellOptions) => TShellOptions | TZurk | TZurkPromise) | (($: TShell, target: TZurk, ctx: TShellCtx) => TZurk) | (($: TShell, target: Promise<TZurk> | TZurkPromise, ctx: TShellCtx) => TZurkPromise);
export interface TShell extends TShellExtra {
    mixins: TMixin[];
    <O extends void>(this: O, pieces?: TemplateStringsArray, ...args: any[]): TShellResponse;
    <O extends TShellOptions = TShellOptions, R = O extends {
        sync: true;
    } ? TShellResponseSync : TShellResponse>(this: O, pieces?: TemplateStringsArray, ...args: any[]): R;
    <O extends TShellOptions = TShellOptions, R = O extends {
        sync: true;
    } ? TShellSync : TShell>(opts: O): R;
}
export interface TShellSync {
    <O>(this: O, pieces?: TemplateStringsArray, ...args: any[]): TShellResponseSync;
    (opts: TShellOptions): TShellSync;
}
/**
 * Zurk $ template API
 *
 * @param pieces
 * @param args
 */
export declare const $: TShell;
/**
 * Applies mixins to the result.
 * @param $
 * @param result
 * @param parent
 * @returns TZurk | TZurkPromise | TShellOptions
 */
export declare const applyMixins: ($: TShell, result: TZurk | TZurkPromise | TShellOptions, parent?: TZurk | TZurkPromise) => TZurk | TZurkPromise | TShellOptions;
