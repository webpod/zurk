# zurk

<sup>
– cute sounds but never friendly. <br/>
– eat all kinds of materials.
</sup>

## 🔬🧫

> This subproject is a kind of experiment, addressed to the [google/zx/issues/589](https://github.com/google/zx/issues/589).
Just a testing ground for verifying ideas and approaches aimed at improve the [zx](https://github.com/google/zx) architecture.

## Concepts
* **Layered** architecture:
  * `spawn` builds a configurable exec context around the `node:child_process` API.
  * `zurk` implements the API for sync and async executions.
  * `x` provides the basic template-string API.
* **Granularity**: the package provides several entry points to help user to choose the right level of abstraction and/or to assist with tree-shaking.
* **Extensibility**: 
  * The context object at every layer is accessible fo modify.
  * Typings are mostly represented by interfaces, so it's easy to tweak up if necessary. 

## Install
```bash
yarn add zurk
```

## API

```ts
import {$, exec, zurk} from 'zurk'

const r1 = exec({sync: true, cmd: 'echo foo'})
const r2 = await zurk({sync: false, cmd: 'echo foo'})
const r3 = await $`echo foo`
```

## Proposals
- [x] Promises in cmd literals
```ts
const foo = $`echo foo`
const foobarbaz = (await $`echo ${foo} ${$`echo bar`} ${await $`echo baz`}`)
```

- [x] Both sync and async executions
```ts
const p1 = $`echo foo`
const p2 = $({sync: true})`echo foo`

const o1 = (await p1).toString()  // foo
const o2 = await p1.stdout        // foo
const o3 = p2.stdout              // foo
```

- [x] Configurable input
```ts
const input = '{"name": "foo"}'
const name = await $({input})`jq -r .name` // foo

const stdin = fs.createReadStream(path.join(fixtures, 'foo.json'))
const data = await $({stdin})`jq -r .data` // foo

const p = $`echo "5\\n3\\n1\\n4\\n2"`
const sorted = $({input: p})`sort`          // 1\n2\n3\n4\n5
```

- [x] Pipe as literal
```ts
const result = $`echo "5\\n3\\n1\\n4\\n2"`

const piped0 = result.pipe`sort | cat`     // '1\n2\n3\n4\n5'
const piped1 = result.pipe`sort`.pipe`cat` // ...
const piped2 = (await result).pipe`sort`
const piped3 = result.pipe($`sort`)
```

- [x] Presets
```ts
const $$ = $({sync: true, cmd: 'echo foo'})
const $$$ = $$({cmd: 'echo bar'})

const p1 = $$()           // foo
const p2 = $$$()          // bar
const p3 = $$`echo baz`   // baz
```

- [x] AbortController
```ts
const ac = new AbortController()
const p = $({nothrow: true, ac})`sleep 10`
setTimeout(() => {
  ac.signal.abort() // or just `p.abort()`
}, 500)

const { error } = await p
error.message // 'The operation was aborted'
```

- [ ] Stdout limit

## License
[MIT](./LICENSE)
