import * as cp from 'node:child_process';
import EventEmitter from 'node:events';
import { Buffer } from 'node:buffer';
import { Readable, Writable, Stream, Transform } from 'node:stream';
/**
 * @module zurk/spawn
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
export * from './util.js';
export type TSpawnError = any;
export type TPushable<T = any> = {
    push(...args: T[]): number;
};
export type TJoinable = {
    join(sep?: string): string;
};
export type TArrayLike<T> = Iterable<T> & TPushable<T> & TJoinable & {
    length: number;
    [i: number]: T | undefined;
};
export type TSpawnStoreChunks = TArrayLike<string | Buffer>;
export type TSpawnStore = {
    stdout: TSpawnStoreChunks;
    stderr: TSpawnStoreChunks;
    stdall: TSpawnStoreChunks;
};
export type TSpawnResult = {
    stderr: string;
    stdout: string;
    stdall: string;
    stdio: [Readable | Writable, Writable, Writable];
    status: number | null;
    signal: NodeJS.Signals | null;
    duration: number;
    ctx: TSpawnCtxNormalized;
    error?: TSpawnError;
    child?: TChild;
};
export type TSpawnListeners = {
    start: (data: TChild, ctx: TSpawnCtxNormalized) => void;
    stdout: (data: Buffer, ctx: TSpawnCtxNormalized) => void;
    stderr: (data: Buffer, ctx: TSpawnCtxNormalized) => void;
    stdall: (data: Buffer, ctx: TSpawnCtxNormalized) => void;
    abort: (error: Event, ctx: TSpawnCtxNormalized) => void;
    err: (error: Error, ctx: TSpawnCtxNormalized) => void;
    end: (result: TSpawnResult, ctx: TSpawnCtxNormalized) => void;
};
export type TSpawnCtx = Partial<Omit<TSpawnCtxNormalized, 'child'>>;
export type TChild = ReturnType<typeof cp.spawn>;
export type TInput = string | Buffer | Stream;
export interface TSpawnCtxNormalized {
    id: string;
    cwd: string;
    cmd: string;
    sync: boolean;
    args: ReadonlyArray<string>;
    input: TInput | null;
    stdio: cp.StdioOptions;
    detached: boolean;
    env: Record<string, string | undefined>;
    ee: EventEmitter;
    on: Partial<TSpawnListeners>;
    ac: AbortController;
    signal: AbortController['signal'];
    shell: string | boolean | undefined;
    spawn: typeof cp.spawn;
    spawnSync: typeof cp.spawnSync;
    spawnOpts: Record<string, any>;
    store: TSpawnStore;
    callback: (err: TSpawnError, result: TSpawnResult) => void;
    stdin: Readable;
    stdout: Writable;
    stderr: Writable;
    child?: TChild;
    fulfilled?: TSpawnResult;
    error?: any;
    run: (cb: () => void, ctx: TSpawnCtxNormalized) => void;
    stack: string;
}
export declare const defaults: TSpawnCtxNormalized;
export declare const normalizeCtx: (...ctxs: TSpawnCtx[]) => TSpawnCtxNormalized;
export declare const processInput: (child: TChild, input?: TInput | null) => void;
export declare class VoidStream extends Transform {
    _transform(chunk: any, _: string, cb: (err?: Error) => void): void;
}
export declare const buildSpawnOpts: ({ spawnOpts, stdio, cwd, shell, input, env, detached, signal }: TSpawnCtxNormalized) => {
    env: Record<string, string | undefined>;
    cwd: string;
    stdio: cp.StdioOptions;
    shell: string | boolean | undefined;
    input: string | Buffer;
    windowsHide: boolean;
    detached: boolean;
    signal: AbortSignal;
};
export declare const toggleListeners: (pos: "on" | "off", ee: EventEmitter, on?: Partial<TSpawnListeners>) => void;
export declare const createStore: () => TSpawnStore;
export declare const invoke: (c: TSpawnCtxNormalized) => TSpawnCtxNormalized;
export declare const exec: (ctx: TSpawnCtx) => TSpawnCtxNormalized;
