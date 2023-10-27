const { join, sep } = require('path')
const test = require('brittle')
const resolve = require('../index.js')
const path = require('path')

test('dotdot', (t) => {
  t.plan(4)
  const dir = path.join(__dirname, '/dotdot/abc')

  resolve('..', { basedir: dir }, (err, res, pkg) => {
    t.is(err, null)
    t.is(res, path.join(__dirname, 'dotdot/index.js'))
  })

  resolve('.', { basedir: dir }, (err, res, pkg) => {
    t.is(err, null)
    t.is(res, path.join(dir, 'index.js'))
  })
})

test('non-existent basedir should return invalid basedir error', function (t) {
  t.plan(2)

  const opts = {
    basedir: join(sep, 'unreal', 'path', 'that', 'does', 'not', 'exist')
  }

  const module = './dotdot/abc'

  resolve(module, opts, function (err, res) {
    t.is(err.code, 'INVALID_BASEDIR')
    t.is(res, undefined)
  })
})
