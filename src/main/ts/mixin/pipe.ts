import { Writable } from 'node:stream'
import { assign, isStringLiteral } from '../util.ts'
import { VoidStream } from '../spawn.ts'
import type { TShell, TMixin, TShellCtx } from '../x.ts'
import { type TZurk, type TZurkPromise, isZurkAny } from '../zurk.ts'

/**
 * @module
 *
 * Zurk $ pipe mixin
 */

// eslint-disable-next-line sonarjs/cognitive-complexity
export const pipeMixin: TMixin = <T extends TZurk | TZurkPromise >($: TShell, result: T, ctx: TShellCtx) =>
  isZurkAny(result)
    ? assign(result, {
      pipe(...args: any) {
        const [target, ...rest] = args
        const { fulfilled, store, ee } = ctx
        const from = new VoidStream()
        const sync = !('then' in result)
        const input = fulfilled ? fulfilled.stdout : from
        const fill = () => {
          for (const chunk of store.stdout) {
            from.write(chunk)
          }
        }
        let _result

        if (isZurkAny(target)) {
          target.ctx.input = input
          _result = target
        } else if (target instanceof Writable) {
          _result = from.pipe(target)
        } else if (isStringLiteral(target, ...rest)) {
          _result = $.apply({ input: input, sync}, args)
        } else {
          throw new Error('Unsupported pipe argument')
        }

        if (fulfilled) {
          fill()
          from.end()
        } else {
          const onStdout = (chunk: string | Buffer) => from.write(chunk)
          ee
            .once('stdout', () => {
              fill()
              ee.on('stdout', onStdout)
            })
            .once('end', () => {
              ee.removeListener('stdout', onStdout)
              from.end()
            })
        }

        return _result
      }
    })
    : result
