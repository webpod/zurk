import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import {
  getCallerLocation,
  getCallerLocationFromString,
  getExitCodeInfo,
  getErrnoMessage,
  formatErrorMessage,
  formatExitMessage,
  EXIT_CODES,
  ERRNO_CODES
} from '../../main/ts/error.js'

import * as all from '../../main/ts/error.js'

describe('error', () => {
  it('has proper exports', () => {
    assert.equal(typeof getCallerLocation, 'function')
    assert.equal(typeof getCallerLocationFromString, 'function')
    assert.equal(typeof getExitCodeInfo, 'function')
    assert.equal(typeof getErrnoMessage, 'function')
    assert.equal(typeof formatErrorMessage, 'function')
    assert.equal(typeof formatExitMessage, 'function')
    assert.equal(typeof EXIT_CODES, 'object')
    assert.equal(typeof ERRNO_CODES, 'object')
    assert.equal(Object.keys(all).length, 8)
  })
})
