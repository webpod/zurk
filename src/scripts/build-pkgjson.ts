import fs from 'node:fs'
import path from 'node:path'

const __dirname = path.dirname(new URL(import.meta.url).pathname)
const root = path.resolve(__dirname, '../..')
const source = 'package.json'
const dest = process.env.PKGJSON_PATH || 'package-main.json'
const _pkgJson = JSON.parse(fs.readFileSync(path.join(root, source), 'utf-8'))

const whitelist = new Set([
  'name',
  'version',
  'description',
  'type',
  'module',
  'main',
  'types',
  'typesVersions',
  'exports',
  'bin',
  'man',
  'files',
  'engines',
  'optionalDependencies',
  'publishConfig',
  'keywords',
  'repository',
  'homepage',
  'author',
  'license',
])

const pkgJson =
  Object.fromEntries(
    Object.entries(_pkgJson)
      .filter(([k]) => whitelist.has(k)))

fs.writeFileSync(path.resolve(root, dest), JSON.stringify(pkgJson, null, 2) + '\n')

console.log(`${dest} prepared for npm`)
