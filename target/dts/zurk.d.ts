import { type TSpawnCtxNormalized, type TSpawnResult, type TSpawnListeners } from './spawn.ts';
import { type Promisified } from './util.ts';
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
export declare const ZURK: unique symbol;
export declare const ZURKPROXY: unique symbol;
export interface TZurkOn<R> {
    on<T extends keyof TSpawnListeners>(name: T, listener: TSpawnListeners[T]): R;
}
export interface TZurk extends TSpawnResult, TZurkOn<TZurk> {
    ctx: TZurkCtx;
}
export type TZurkCtx = TSpawnCtxNormalized & {
    nothrow?: boolean;
    nohandle?: boolean;
};
export type TZurkOptions = Partial<Omit<TZurkCtx, 'callback'>>;
export type TZurkPromise = Promise<TZurk> & Promisified<TZurk> & TZurkOn<TZurkPromise> & {
    ctx: TZurkCtx;
    stdio: TZurkCtx['stdio'];
    child: TZurkCtx['child'];
};
export declare const zurk: <T extends TZurkOptions = TZurkOptions, R = T extends {
    sync: true;
} ? TZurk : TZurkPromise>(opts: T) => R;
export declare const zurkAsync: (opts: TZurkOptions) => TZurkPromise;
export declare const zurkSync: (opts: TZurkOptions) => TZurk;
export declare const zurkifyPromise: (target: Promise<TZurk> | TZurkPromise, ctx: TSpawnCtxNormalized) => TZurkPromise;
export declare const getError: (spawnResult: TSpawnResult) => Error | null;
export declare const isZurkAny: (o: any) => o is TZurk | TZurkPromise;
export declare const isZurk: (o: any) => o is TZurk;
export declare const isZurkPromise: (o: any) => o is TZurkPromise;
export declare const isZurkProxy: (value: any) => boolean;
export declare const zurkFactory: <C extends TSpawnCtxNormalized>(ctx: C) => TZurk;
