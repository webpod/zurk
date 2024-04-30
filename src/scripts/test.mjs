#!/usr/bin/env node

import glob from 'fast-glob'
import { pathToFileURL } from 'node:url'
import process from 'node:process'

const focused = process.argv.slice(2)
const suites = focused.length ? focused : await glob('src/test/**/*.test.{ts,cjs,mjs,js}', {cwd: process.cwd(), absolute: true, onlyFiles: true})

await Promise.all(suites.map(suite => import(pathToFileURL(suite))))
