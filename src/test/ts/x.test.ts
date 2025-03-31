import * as assert from 'node:assert'
import * as fs from 'node:fs'
import * as os from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'
import { Stream } from 'node:stream'
import { getEventListeners } from 'node:events'
import { $ } from '../../main/ts/x.ts'
import { quote, quotePwsh } from '../../main/ts/util.ts'

const __dirname = new URL('.', import.meta.url).pathname
const fixtures = path.resolve(__dirname, '../fixtures')
const tempy = fs.mkdtempSync(path.join(os.tmpdir(), 'tempy-'))
const onStreamFinish = (stream: Stream) => new Promise((resolve) => stream.on('finish', resolve))
const throwError = (err: any = new Error('should have thrown')) => { throw err }

describe('$()', () => {
  it('supports async flow', async () => {
    const p = $`echo foo`

    assert.equal((await p).toString(), 'foo')
    assert.equal(await p.stdout, 'foo\n')
    assert.equal(await p.stderr, '')
    assert.equal(await p.status, 0)

    try {
      await $`exit 2`
    } catch (error: unknown) {
      console.error(error)
      assert.ok((error as Error).message.includes('exit code: 2 (Misuse of shell builtins)'))
    }

    const err = await $`exit 2`.catch((error) => error)
    assert.ok(err.message.includes('exit code: 2 (Misuse of shell builtins)'))
  })

  it('supports sync flow', () => {
    const p = $({sync: true})`echo foo`

    assert.equal(p.toString(), 'foo')
    assert.equal(p.stdout, 'foo\n')
    assert.equal(p.stderr, '')
    assert.deepEqual(p.stdall, 'foo\n')

    try {
      $({sync: true})`exit 2`
    } catch (error: unknown) {
      assert.match((error as Error).message, /exit code: 2 \(Misuse of shell builtins\)/)
    }
  })

  it('handles promises in cmd literal', async () => {
    const example = $`echo example`

    // eslint-disable-next-line sonarjs/no-nested-template-literals
    assert.equal((await $`echo ${example} ${$`echo and`} ${await example}`)
      .toString(), 'example and example')
  })

  it('supports stdin', async () => {
    const input = '{"name": "foo"}'
    const name = await $({input})`jq -r .name`
    assert.equal(name.toString().trim(), 'foo')

    const stdin = fs.createReadStream(path.resolve(fixtures, 'foo.json'))
    const data = await $({stdin})`jq -r .data`
    assert.equal(data.toString().trim(), 'foobar')

    const p = $`echo "5\\n3\\n1\\n4\\n2"`
    const sorted = $({input: p})`sort`

    assert.equal((await sorted).toString(), '1\n2\n3\n4\n5')
  })

  it('handles custom stdio', async () => {
    await $({stdio: ['inherit', 'inherit', 'inherit']})`ls`
    await $({stdio: 'ignore'})`ls`
    $({stdio: 'ignore', sync: true})`ls`
  })

  it('works without shell', async () => {
    const o1 = await $({shell: true})`exit 2 | exit 0`
    const o2 = await $({shell: false, nothrow: true})`exit 1 | exit 0`

    assert.equal(o1.status, 0)
    assert.equal(o2.status, -2)
  })

  it('supports presets', () => {
    const $$ = $({sync: true, cmd: 'echo foo'})
    const $$$ = $$({cmd: 'echo bar'})
    const p1 = $$()
    const p2 = $$$()
    const p3 = $$`echo baz`
    const p4 = $$$({cmd: 'echo qux'})()
    const o1 = p1.stdout
    const o2 = p2.stdout
    const o3 = p3.stdout
    const o4 = p4.stdout

    assert.equal(o1.trim(), 'foo')
    assert.equal(o2.trim(), 'bar')
    assert.equal(o3.trim(), 'baz')
    assert.equal(o4.trim(), 'qux')
  })

  it('accepts custom quote', async () => {
    const arg = 'foo bar'
    const p1 = $({quote})
    const p2 = $({quote: quotePwsh})

    assert.equal(p1`echo ${arg}`.ctx.cmd, "echo $'foo bar'")
    assert.equal(p2`echo ${arg}`.ctx.cmd, "echo 'foo bar'")

    await p1
    await p2
  })
})

describe('mixins', () => {
  describe('kill', () => {
    it('handles `kill`', async () => {
      const p = $({nothrow: true})`sleep 10`
      let killed
      setTimeout(() => killed = p.kill(), 25)

      const { error } = await p
      const signal = await killed

      assert.equal(signal, 'SIGTERM')
      assert.ok(error.message.includes('signal: SIGTERM'))
    })

    it('handles `abort`', async () => {
      const p = $({nothrow: true})`sleep 10`
      const events: any[] = []
      let c = 0

      setTimeout(() => p.abort(), 25)
      setTimeout(() => c = getEventListeners(p.ctx.signal, 'abort').length, 10)
      p
        .on('abort', () => events.push('abort'))
        .on('end', () => events.push('end'))

      const { error } = await p
      assert.ok(getEventListeners(p.ctx.signal, 'abort').length < c)
      assert.ok(error.message.startsWith('The operation was aborted'))
      assert.match(error.message, /code: ABORT_ERR/)
      assert.deepEqual(events, ['abort', 'end'])
    })
  })

  describe('timeout', () => {
    it('handles `timeout` as option', async () => {
      const p = $({ timeout: 25, timeoutSignal: 'SIGALRM', nothrow: true })`sleep 10`

      const { error } = await p
      assert.ok(error.message.includes('signal: SIGALRM'))
    })

    it('handles `timeout` as promise setter', async () => {
      const p = $`sleep 10`
      p.timeoutSignal = 'SIGALRM'
      p.timeout = 25
      p.ctx.nothrow = true

      const { error } = await p
      assert.ok(error.message.includes('signal: SIGALRM'))
    })
  })

  describe('pipe', () => {
    it('supports async flow', async () => {
      const result = $`echo "5\\n3\\n1\\n4\\n2"`
      const expected = '1\n2\n3\n4\n5'
      const writable1 = fs.createWriteStream(path.join(tempy, 'output1.txt'))
      const writable2 = fs.createWriteStream(path.join(tempy, 'output2.txt'))
      const w1 = onStreamFinish(writable1)
      const w2 = onStreamFinish(writable1)

      const piped0 = result.pipe`sort | cat`
      const piped1 = result.pipe`sort`.pipe`cat`
      const piped2 = result.pipe(writable2)
      const piped3 = result.pipe($`sort`)
      const piped4 = (await result).pipe`sort`
      const piped5 = result.pipe($`sort`)
      const piped6 = (await result.pipe`sort`).pipe(writable1)

      assert.equal(piped6, writable1)
      assert.equal(piped2, writable2)
      assert.equal((await piped0).toString(), expected)
      assert.equal((await piped1).toString(), expected)
      assert.equal((await piped3).toString(), expected)
      assert.equal((await piped4).toString(), expected)
      assert.equal((await piped5).toString(), expected)

      await w1
      await w2
      assert.equal(fs.readFileSync(path.join(tempy, 'output1.txt'), 'utf8').trim(), expected)
      assert.equal(fs.readFileSync(path.join(tempy, 'output2.txt'), 'utf8').trim(), '5\n3\n1\n4\n2')
    })

    it('supports sync flow', async () => {
      const result = $({sync: true})`echo "5\\n3\\n1\\n4\\n2"`
      assert.equal(result.toString().trim(), '5\n3\n1\n4\n2')

      const expected = '1\n2\n3\n4\n5'
      const piped = result.pipe`sort`

      assert.equal(piped.toString(), expected)
    })

    it('supports multipiping', async () => {
      const result = $`echo 1; sleep 1; echo 2; sleep 1; echo 3`
      const piped1 = result.pipe`cat`
      let piped2: any

      setTimeout(() => {
        piped2 = result.pipe`cat`
      }, 1500)

      await piped1
      assert.equal((await piped1).toString(), '1\n2\n3')
      assert.equal((await piped2).toString(), '1\n2\n3')
    })
  })
})
