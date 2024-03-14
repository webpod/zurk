import * as cp from 'node:child_process'
import process from 'node:process'
import { Readable, Writable, Stream, Transform } from 'node:stream'
import { assign, noop } from './util.js'

export type TSpawnError = any

export type TSpawnResult = {
  stderr:   string
  stdout:   string
  stdall:   string,
  stdio:    [Readable | Writable, Writable, Writable]
  status:   number | null
  signal:   NodeJS.Signals | null
  duration: number
  _ctx:     TSpawnCtxNormalized
  error?:   TSpawnError,
  child?:   TChild
}

export type TSpawnCtx = Partial<Omit<TSpawnCtxNormalized, 'child'>>

export type TChild = ReturnType<typeof cp.spawn>

export type TInput = string | Buffer | Stream

export interface TSpawnCtxNormalized {
  cwd:        string
  cmd:        string
  sync:       boolean
  args:       ReadonlyArray<string>
  input:      TInput | null
  env:        Record<string, string | undefined>
  stdio:      ['pipe', 'pipe', 'pipe']
  detached:   boolean
  ac:         AbortController
  shell:      string | true | undefined
  spawn:      typeof cp.spawn
  spawnSync:  typeof cp.spawnSync
  spawnOpts:  Record<string, any>
  callback:   (err: TSpawnError, result: TSpawnResult) => void
  onStdout:   (data: string | Buffer) => void
  onStderr:   (data: string | Buffer) => void
  stdin:      Readable
  stdout:     Writable
  stderr:     Writable
  child?:     TChild
  fulfilled?: TSpawnResult
  error?:     any
  run:        (cb: () => void, ctx: TSpawnCtxNormalized) => void
  // kill:       (signal: number) => void
}

export const normalizeCtx = (...ctxs: TSpawnCtx[]): TSpawnCtxNormalized => assign({
  cmd:        '',
  cwd:        process.cwd(),
  sync:       false,
  args:       [],
  input:      null,
  env:        process.env,
  ac:         new AbortController(),
  detached:   true,
  shell:      true,
  spawn:      cp.spawn,
  spawnSync:  cp.spawnSync,
  spawnOpts:  {},
  callback:   noop,
  onStdout:   noop,
  onStderr:   noop,
  stdin:      new VoidWritable(),
  stdout:     new VoidWritable(),
  stderr:     new VoidWritable(),
  stdio:      ['pipe', 'pipe', 'pipe'],
  run:        setImmediate,
}, ...ctxs)

export const processInput = (child: TChild, input?: TInput | null) => {
  if (input && child.stdin && !child.stdin.destroyed) {
    if (input instanceof Stream) {
      input.pipe(child.stdin)
    } else {
      child.stdin.write(input)
      child.stdin.end()
    }
  }
}

export class VoidWritable extends Transform {
  _transform(chunk: any, _: string, cb: (err?: Error) => void) {
    this.emit('data', chunk)
    cb()
  }
}

export const buildSpawnOpts = ({spawnOpts, stdio, cwd, shell, input, env, detached, ac: {signal}}: TSpawnCtxNormalized) => ({
  ...spawnOpts,
  env,
  cwd,
  stdio,
  shell,
  input: input as string | Buffer,
  windowsHide: true,
  detached,
  signal
})

export const invoke = (c: TSpawnCtxNormalized): TSpawnCtxNormalized => {
  const now = Date.now()
  const stdio: TSpawnResult['stdio'] = [c.stdin, c.stdout, c.stderr]

  try {
    if (c.sync) {
      const opts = buildSpawnOpts(c)
      const result = c.spawnSync(c.cmd, c.args, opts)

      c.stdout.write(result.stdout)
      c.stderr.write(result.stderr)
      c.onStdout(result.stdout)
      c.onStderr(result.stderr)
      c.callback(null, c.fulfilled = {
        ...result,
        stdout:   result.stdout.toString(),
        stderr:   result.stderr.toString(),
        stdio,
        get stdall() { return this.stdout + this.stderr },
        duration: Date.now() - now,
        _ctx:     c
      })

    } else {
      c.run(() => {
        let error: any = null
        // let status: number | null = null
        const opts = buildSpawnOpts(c)
        const stderr: string[] = []
        const stdout: string[] = []
        const stdall: string[] = []
        const child = c.spawn(c.cmd, c.args, opts)
        c.child = child

        opts.signal.addEventListener('abort', () => {
          if (opts.detached && child.pid) {
            try {
              // https://github.com/nodejs/node/issues/51766
              process.kill(-child.pid)
            } catch {
              child.kill()
            }
          }
        })
        processInput(child, c.input || c.stdin)

        child.stdout.pipe(c.stdout).on('data', (d) => { stdout.push(d); stdall.push(d); c.onStdout(d) })
        child.stderr.pipe(c.stderr).on('data', (d) => { stderr.push(d); stdall.push(d); c.onStderr(d) })
        child.on('error', (e) => error = e)
        // child.on('exit', (_status) => status = _status)
        child.on('close', (status, signal) => {
          c.callback(error, c.fulfilled = {
            error,
            status,
            signal,
            stdout:   stdout.join(''),
            stderr:   stderr.join(''),
            stdall:   stdall.join(''),
            stdio:    [c.stdin, c.stdout, c.stderr],
            duration: Date.now() - now,
            _ctx:     c
          })
        })
      }, c)
    }
  } catch (error: unknown) {
    c.callback(
      error,
      c.fulfilled ={
        error,
        status:   null,
        signal:   null,
        stdout:   '',
        stderr:   '',
        stdall:   '',
        stdio,
        duration: Date.now() - now,
        _ctx:     c
      }
    )
  }

  return c
}

// https://2ality.com/2018/05/child-process-streams.html
