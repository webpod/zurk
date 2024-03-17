import * as assert from 'node:assert'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { describe, it } from 'node:test'
import { Stream } from 'node:stream'
import { $ } from '../../main/ts/x.js'

const __dirname = new URL('.', import.meta.url).pathname
const fixtures = path.resolve(__dirname, '../fixtures')
const tempy = fs.mkdtempSync(path.join(os.tmpdir(), 'tempy-'))
const onStreamFinish = (stream: Stream) => new Promise((resolve) => stream.on('finish', resolve))
const throwError = (err: any = new Error('should have thrown')) => { throw err }

describe('$()', () => {
  it('supports async flow', async () => {
    const p = $`echo foo`
    const o1 = (await p).toString()
    const o2 = await p.stdout

    assert.equal(o1, 'foo')
    assert.equal(o2.trim(), 'foo')
    assert.equal(await p.status, 0)
  })

  it('supports sync flow', () => {
    const p = $({sync: true})`echo foo`
    const o1 = p.toString()
    const o2 = p.stdout

    assert.equal(o1, 'foo')
    assert.equal(o2.trim(), 'foo')
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
      assert.equal(error.message, 'Command failed with signal SIGTERM')
    })

    it('handles `abort`', async () => {
      const p = $({nothrow: true})`sleep 10`
      const events: any[] = []

      setTimeout(() => p.abort(), 25)
      p
        .on('abort', () => events.push('abort'))
        .on('end', () => events.push('end'))

      const { error } = await p
      assert.equal(error.message, 'The operation was aborted')
      assert.deepEqual(events, ['abort', 'end'])
    })
  })

  describe('timeout', () => {
    it('handles `timeout` as option', async () => {
      const p = $({ timeout: 25, timeoutSignal: 'SIGALRM', nothrow: true })`sleep 10`

      const { error } = await p
      assert.equal(error.message, 'Command failed with signal SIGALRM')
    })

    it('handles `timeout` as promise setter', async () => {
      const p = $`sleep 10`
      p.timeoutSignal = 'SIGALRM'
      p.timeout = 25
      p.ctx.nothrow = true

      const { error } = await p
      assert.equal(error.message, 'Command failed with signal SIGALRM')
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
  })
})
