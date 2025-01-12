export type * from './spawn.js';
export type * from './x.js';
export type * from './zurk.js';
export { invoke, exec, defaults } from './spawn.js';
export { $ } from './x.js';
export { zurk } from './zurk.js';
export { type Promisified, buildCmd } from './util.js';
/**
 * @module
 *
 * A generic process spawner
 *
 * @example
 * ```ts
 * import {$, exec, zurk} from 'zurk'
 *
 * const r1 = exec({sync: true, cmd: 'echo foo'})
 * const r2 = await zurk({sync: false, cmd: 'echo foo'})
 * const r3 = await $`echo foo`
 * ```
 */
