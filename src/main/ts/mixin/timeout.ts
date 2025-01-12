import process from 'node:process'
import { assign, pFinally } from '../util.js'
import type { TMixin, TShell, TShellCtx } from '../x.js'
import { type TZurk, type TZurkPromise, isZurkPromise } from '../zurk.js'

/**
 * @module
 *
 * Zurk $ timeout mixin
 */

const attachTimeout = <T extends TZurkPromise & { kill?: (signal: NodeJS.Signals) => void }>(
  ctx: TShellCtx,
  result: T
) => {
  clearTimeout(ctx.timer)
  if (ctx.timeout === undefined) return

  const kill = () => {
    const { child, timeoutSignal = 'SIGTERM' } = ctx
    if (result.kill) return result.kill(timeoutSignal)
    if (child?.pid) process.kill(child.pid as number, timeoutSignal)
  }
  ctx.timer = setTimeout(kill, ctx.timeout)
}

export const timeoutMixin: TMixin = <T extends TZurk | TZurkPromise >($: TShell, result: T, ctx: TShellCtx) => {
  if (isZurkPromise(result)) {
    assign(result, {
      set timeoutSignal(timeoutSignal: NodeJS.Signals) {
        assign(ctx, { timeoutSignal })
      },
      set timeout(timeout: number) {
        assign(ctx, {timeout})
        attachTimeout(ctx, result)
      }
    })

    attachTimeout(ctx, result)
    pFinally(result,() => clearTimeout((ctx as any).timer))
  }

  return result
}
