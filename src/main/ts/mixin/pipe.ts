import { Writable } from 'node:stream'
import { assign } from '../util.js'
import { VoidWritable } from '../spawn.js'
import type { TShell, TMixin, TShellCtx } from '../x.js'
import { type TZurk, type TZurkPromise, isZurkAny } from '../zurk.js'

// eslint-disable-next-line sonarjs/cognitive-complexity
export const pipeMixin: TMixin = <T extends TZurk | TZurkPromise >($: TShell, result: T, ctx: TShellCtx) =>
  isZurkAny(result)
    ? assign(result, {
      pipe(...args: any[]) {
        const target = args[0]
        const { fulfilled, stdout, store } = ctx
        if (isZurkAny(target)) {
          // stream.ctx.input = fulfilled.stdout
          const input = new VoidWritable()
          target.ctx.input = input
          for (const chunk of store.stdout) {
            input.push(chunk)
          }
          if (fulfilled) {
            input.push(null)
          } else {
            stdout.pipe(input)
          }

          return target
        }

        if (target instanceof Writable) {
          for (const chunk of store.stdout) {
            target.write(chunk)
          }
          if (fulfilled) {
            target.end()
            return target
          }

          return stdout.pipe(target)
        }

        return $.apply({input: fulfilled?.stdout || stdout, sync: !('then' in result)}, args as any)
      }
    })
    : result
