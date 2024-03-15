import { Writable } from 'node:stream'
import { assign } from '../util.js'
import type { VoidWritable } from '../spawn.js'
import type { TShell, TMixin, TShellCtx } from '../x.js'
import { type TZurk, type TZurkPromise, isZurkAny } from '../zurk.js'

// eslint-disable-next-line sonarjs/cognitive-complexity
export const pipeMixin: TMixin = <T extends TZurk | TZurkPromise >($: TShell, result: T, ctx: TShellCtx) =>
  isZurkAny(result)
    ? assign(result, {
      pipe(...args: any[]) {
        const stream = args[0]
        const { fulfilled, stdout} = ctx
        if (isZurkAny(stream)) {
          if (fulfilled) {
            stream.ctx.input = fulfilled.stdout
          } else {
            stream.ctx.stdin = stdout as VoidWritable
          }

          return stream
        }

        if (stream instanceof Writable) {
          if (fulfilled) {
            stream.write(result.stdout)
            stream.end()

            return stream
          }

          return stdout.pipe(stream)
        }

        return $.apply({input: fulfilled?.stdout || stdout, sync: !('then' in result)}, args as any)
      }
    })
    : result
