#!/usr/bin/env zx

import assert from 'node:assert'
import process from 'node:process'
import { describe, it } from 'node:test'
// import { $, tempdir, argv } from 'zx'

const MODE = argv.mode || 'run'
const SECRETS = ['NPM_TOKEN', 'GH_TOKEN', 'GITHUB_TOKEN', 'AUTH_TOKEN']
const GH_URL = 'https://github.com'

export interface TContext {
  cwd?: string
  buildCmd?: string
  repoName: string,
  repoBranch: string
  repoCommit: string
  npmToken: string
  npmRegistry: string
}

export const protect = (env = process.env) => {
  if (SECRETS.some(k => k in env)) throw new Error('Credentials should not be observable from the build step')
}

export const createContext = (av: Record<any, string> = argv, env = process.env) => {
  const input = {
    cwd: process.cwd(),
    ...JSON.parse(av.ctx || env.CTX || '{}'),
    ...av,
  }

  const sourceRef = input.source && parseSourceRef(input.source)
  const ctx: TContext = {
    ...input,
    ...sourceRef
  }

  if (!(ctx.repoName && ctx.repoBranch && ctx.repoCommit)) throw new Error('One of `source` or `repoName, repoBranch, repoCommit` is required')

  return ctx
}

export const parseSourceRef = (ref: string): Pick<TContext, 'repoName' | 'repoBranch' | 'repoCommit'> => {
  const re = /^(?:https:\/\/:)?([\w-]+\/[\w-]+)\/([\w-]+(?:\/[\w-]+)*)\/([\da-f]{40})/i
  const [, repoName, repoBranch, repoCommit] = re.exec(ref) || []

  if (!repoName) throw new Error('Invalid source ref')

  return {
    repoName,
    repoBranch,
    repoCommit
  }
}

export const fetchSource = async (ctx: Pick<TContext, 'repoName' | 'repoBranch' | 'repoCommit' | 'cwd'>) => {
  const repoUrl = `${GH_URL}/${ctx.repoName}`
  const $$ = $({cwd: ctx.cwd, quiet: true})
  await $$`git clone -b ${ctx.repoBranch} --depth=1 ${repoUrl} .`

  const commitId = (await $$`git rev-parse HEAD`).toString().trim()
  if (ctx.repoCommit !== commitId) throw new Error(`Commit hash mismatch: ${ctx.repoCommit} !== ${commitId} at remote ${ctx.repoBranch} HEAD`)
}

export const buildSource = async ({cwd, buildCmd}: Pick<TContext, 'cwd'  | 'buildCmd'>) =>
  buildCmd ? $({cwd})`${buildCmd}` : $({cwd})`exit 0`

export const buildFromRemote = async (av = argv, env = process.env)=> {
  protect()
  const ctx = createContext(av, env)
  await fetchSource(ctx)
  await buildSource(ctx)
}

;(async() => {
  try {
    if (MODE === 'run') {
      await run()
      process.exit(0)
    } else if (MODE === 'test') {
      test()
    } else {
      throw new Error(`unknown mode: ${MODE}. Only 'test' & 'run' values are supported`)
    }
  } catch (e: unknown) {
    console.error((e as Error).message)
    process.exit(1)
  }
})()

async function run () {
  await buildFromRemote()
}

function test(){
  describe('build-from-remote', () => {
    describe('createContext', () => {
      it('inits script context', () => {
        const source = 'google/zx/main/0cba54884f3084af1674118ef6299302d82daaf9'
        const ref = parseSourceRef(source)
        assert.deepEqual(createContext({cwd: 'foo', source}), {cwd: 'foo', ...ref, source})
        assert.deepEqual(createContext({}, {CTX: JSON.stringify({cwd: 'foo', source})}), {cwd: 'foo', ...ref, source})

        try {
          createContext({}, {})
        } catch (e) {
          assert.equal((e as Error).message, 'One of `source` or `repoName, repoBranch, repoCommit` is required')
        }
      })
    })

    describe('protect', () => {
      it('raises an error if secrets are exposed', () => {
        try {
          protect({ NPM_TOKEN: 'Foo' })
        } catch (e) {
          assert.equal((e as Error).message, 'Credentials should not be observable from the build step')
        }
      })

      it('does nothing otherwise', () => {
        protect({})
      })
    })

    describe('parseSourceRef()', () => {
      it('parses code reference', () => {
        const ref = 'google/zx/main/0cba54884f3084af1674118ef6299302d82daaf9'
        const repoCtx = parseSourceRef(ref)

        assert.deepEqual(repoCtx, {
          repoName: 'google/zx',
          repoBranch: 'main',
          repoCommit: '0cba54884f3084af1674118ef6299302d82daaf9'
        })
      })
    })

    describe('fetchSource()', () => {
      it('clones repo', async () => {
        const commitId = (await $`git ls-remote git@github.com:google/zx.git refs/heads/main`).toString().trim()
        const source = `google/zx/main/${commitId}`
        const ref = parseSourceRef(source)
        const cwd = tempdir()
        const ctx = {...ref, cwd}
        await fetchSource(ctx)
      })

      it('raises an error on commit id mismatch', async () => {
        const source = 'google/zx/main/63ceddb2a2ae74072190683c61c4563b52aef356'
        const ref = parseSourceRef(source)
        const cwd = tempdir()
        const ctx = {...ref, cwd}

        try {
          await fetchSource(ctx)
        } catch (e: unknown) {
          assert.match((e as Error).message, /Commit hash mismatch: 63ceddb2a2ae74072190683c61c4563b52aef356 !== \w{40} at remote main HEAD/)
        }
      })

      it('raises an error if source does not exist', async () => {
        const source = 'google/zx/foobar/63ceddb2a2ae74072190683c61c4563b52aef356'
        const ref = parseSourceRef(source)
        const cwd = tempdir()
        const ctx = {...ref, cwd}

        try {
          await fetchSource(ctx)
        } catch (e: unknown) {
          assert.match((e as Error).message, /Could not find remote branch foobar to clone/)
        }
      })
    })

    describe('build', () => {
      it('invokes build cmd if specified', async () => {
        const cwd = tempdir()
        const result = await buildSource({
          cwd,
          buildCmd: 'pwd'
        })
        assert.ok(result.stdout.trim().endsWith(cwd))
      })

      it('triggers exit 0 otherwise', async () => {
        const cwd = tempdir()
        const result = await buildSource({ cwd })
        assert.equal(result.stdout.trim(), '')
      })
    })
  })
}
