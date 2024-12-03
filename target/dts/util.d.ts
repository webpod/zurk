import { Stream } from 'node:stream';
import { Buffer } from 'node:buffer';
export declare const g: typeof globalThis;
export declare const immediate: typeof setImmediate;
export declare const noop: () => void;
export declare const asyncVoidCall: (cb: TVoidCallback) => () => Promise<void>;
export declare const randomId: () => string;
export type PromiseResolve<T = any> = (value: T | PromiseLike<T>) => void;
export type TVoidCallback = (...any: any) => void;
export type Promisified<T> = {
    [K in keyof T]: T[K] extends (...args: any) => infer R ? (...args: Parameters<T[K]>) => Promise<R> : Promise<T[K]>;
};
export declare const makeDeferred: <T = any, E = any>() => {
    promise: Promise<T>;
    resolve: PromiseResolve<T>;
    reject: PromiseResolve<E>;
};
export declare const isPromiseLike: (value: any) => boolean;
export declare const isStringLiteral: (pieces: any, ...rest: any[]) => pieces is TemplateStringsArray;
export declare const assign: <T, E>(target: T, ...extras: E[]) => T;
export declare const quote: (arg: string) => string;
export type TQuote = (input: string) => string;
export declare const buildCmd: (quote: TQuote, pieces: TemplateStringsArray, args: any[], subs?: TSubstitute) => string | Promise<string>;
export type TSubstitute = (arg: any) => string;
export declare const substitute: TSubstitute;
export declare const parseInput: (input: any) => string | Buffer | Stream | null;
export declare const pFinally: (p: Promise<any>, cb: TVoidCallback) => Promise<void>;
