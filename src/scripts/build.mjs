#!/usr/bin/env node

import process from 'node:process'
import esbuild from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'
import { entryChunksPlugin } from 'esbuild-plugin-entry-chunks'
import { transformHookPlugin } from 'esbuild-plugin-transform-hook'
import { extractHelpersPlugin } from 'esbuild-plugin-extract-helpers'
import { injectFile } from 'esbuild-plugin-utils'
import minimist from 'minimist'
import glob from 'fast-glob'
import path from "node:path";

const unwrapQuotes = str => str.replace(/^['"]|['"]$/g, '')
const argv = minimist(process.argv.slice(2), {
  default: {
    entry:      './src/main/ts/index.ts',
    external:   'node:*',
    bundle:     'src', // 'all' | 'none'
    license:    'eof',
    minify:     false,
    sourcemap:  false,
    format:     'cjs,esm',
    cwd:        process.cwd()
  },
  boolean: ['minify', 'sourcemap', 'banner'],
  string: ['entry', 'external', 'bundle', 'license', 'format', 'map', 'cwd']
})
const { entry, external, bundle, minify, sourcemap, license, format, cwd: _cwd } = argv
const plugins = []
const cwd = Array.isArray(_cwd) ? _cwd[_cwd.length - 1] : _cwd
const entryPoints = entry.includes('*')
  ? await glob(unwrapQuotes(entry).split(':'), { absolute: false, onlyFiles: true, cwd })
  : unwrapQuotes(entry).split(':')

const _bundle = bundle !== 'none' && !process.argv.includes('--no-bundle')
const _external = _bundle
  ? external.split(',')
  : undefined  // https://github.com/evanw/esbuild/issues/1466

if (_bundle && entryPoints.length > 1) {
  plugins.push(entryChunksPlugin())
}

if (bundle === 'src') {
  // https://github.com/evanw/esbuild/issues/619
  // https://github.com/pradel/esbuild-node-externals/pull/52
  plugins.push(nodeExternalsPlugin())
}

const cjsPlugins = [
  extractHelpersPlugin({
    helper: 'cjslib.cjs',
    cwd: 'target/cjs',
    include: /\.cjs/,
  }),
  transformHookPlugin({
    hooks: [
      {
        on: 'end',
        pattern: /cjslib/,
        transform(contents) {
          return injectFile(contents.toString(), './src/scripts/object.polyfill.cjs')
        },
      },
      {
        on: 'end',
        pattern: entryPointsToRegexp(entryPoints),
        transform(contents, p) {
          return contents
            .toString()
            .replaceAll('"node:', '"')
            .replace(
              /0 && \(module\.exports =(.|\n)+/,
              ($0) => {
                if (!$0.includes('...')) return $0

                const lines = $0.split('\n').slice(1, -1)
                const vars = []
                const reexports = []
                lines.forEach((l) => {
                  const e = /\s*\.{3}(require\(.+\))/.exec(l)?.[1]
                  if (e) {
                    reexports.push(e)
                  } else {
                    vars.push(l)
                  }
                })

                return `0 && (module.exports = Object.assign({
${vars.join('\n')}
}, ${reexports.join(',\n')}))`
              }
            )
        },
      },]
  })
]

const formats = format.split(',')

const esmConfig = {
  absWorkingDir: cwd,
  entryPoints,
  outdir: './target/esm',
  bundle: _bundle,
  external: _external,
  minify,
  sourcemap,
  sourcesContent: false,
  platform: 'node',
  target: 'es2019',
  format: 'esm',
  outExtension: {
    '.js': '.mjs'
  },
  plugins,
  legalComments: license,
  tsconfig: './tsconfig.json',

}

const cjsConfig = {
  ...esmConfig,
  outdir: './target/cjs',
  target: 'es2015',
  format: 'cjs',
  banner: {},
  outExtension: {
    '.js': '.cjs'
  },
  plugins: [
    ...plugins,
    ...cjsPlugins
  ],
}

for (const format of formats) {
  const config = format === 'cjs' ? cjsConfig : esmConfig

  await esbuild
    .build(config)
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}

function entryPointsToRegexp(entryPoints) {
  return new RegExp(
    '(' + entryPoints.map((e) => escapeRegExp(path.parse(e).name)).join('|') + ')\\.cjs$'
  )
}

function escapeRegExp(str) {
  return str.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&')
}

process.exit(0)
