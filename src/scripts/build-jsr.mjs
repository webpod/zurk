import fs from 'fs'
import path from 'path'
const cwd = process.cwd()
const pkgJson = JSON.parse(fs.readFileSync(path.resolve(cwd, 'package.json'), 'utf-8'))

fs.writeFileSync(path.resolve(cwd, 'jsr.json'), JSON.stringify({
  name: '@webpod/zurk',
  version: pkgJson.version,
  exports: {
    '.': './src/main/ts/index.ts',
    './spawn': './src/main/ts/spawn.ts',
    './util': './src/main/ts/util.ts',
    './zurk': './src/main/ts/zurk.ts'
  },
  publish: {
    include: ['src/main/ts']
  }
}, null, 2))
