export type * from './spawn.ts'
export type * from './x.ts'
export type * from './zurk.ts'

export { invoke, exec, defaults, VoidStream, isStringLiteral, quote, quotePwsh, buildCmd } from './spawn.ts'
export { $ } from './x.ts'
export { zurk } from './zurk.ts'

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
