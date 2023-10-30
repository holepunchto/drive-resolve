const { dirname, join } = require('path')
const test = require('brittle')
const resolve = require('../index.js')

test('resolves absolute dir', (t) => {
  t.plan(2)
  const path = join(__dirname, '/fixtures/relative/path')
  resolve(path, { basedir: __dirname }, (err, result) => {
    t.is(err, null)
    t.is(result, join(path, 'index.js'))
  })
})

test('resolves absolute file', (t) => {
  t.plan(2)
  const path = join(__dirname, '/fixtures/relative/path/index.js')
  resolve(path, { basedir: __dirname }, (err, result) => {
    t.is(err, null)
    t.is(result, path)
  })
})

test('resolves relative path', (t) => {
  t.plan(4)
  {
    const path = './fixtures/relative/path'
    resolve(path, { basedir: __dirname }, (err, result) => {
      t.is(err, null)
      t.is(result, join(dirname(__dirname), '/test/fixtures/relative/path/index.js'))
    })
  }
  {
    const path = '../test/fixtures/relative/path'
    resolve(path, { basedir: __dirname }, (err, result) => {
      t.is(err, null)
      t.is(result, join(dirname(__dirname), '/test/fixtures/relative/path/index.js'))
    })
  }
})

test('package.json main', (t) => {
  t.plan(2)
  const path = join(__dirname, '/fixtures/main')
  resolve(path, { basedir: __dirname }, (err, result) => {
    t.is(err, null)
    t.is(result, join(path, 'main.js'))
  })
})

test('package.json main is folder', (t) => {
  t.plan(2)
  const path = join(__dirname, '/fixtures/main-is-folder')
  resolve(path, { basedir: __dirname }, (err, result) => {
    t.is(err, null)
    t.is(result, join(path, '/lib/index.js'))
  })
})

test('no extension', (t) => {
  t.plan(2)
  const path = join(__dirname, '/fixtures/relative/path/index')
  resolve(path, { basedir: __dirname }, (err, result) => {
    t.is(err, null)
    t.is(result, path + '.js')
  })
})

test('async foo', (t) => {
  t.plan(2)
  const dir = join(__dirname, 'resolver')

  resolve('./foo', { basedir: dir }, function (err, res) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'foo.js'))
  })

  resolve('./foo.js', { basedir: dir }, function (err, res) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'foo.js'))
  })
})

test('bar', function (t) {
  t.plan(1)
  const dir = join(__dirname, 'resolver')
  resolve('foo', { basedir: dir + '/bar' }, function (err, res, pkg) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'bar/node_modules/foo/index.js'))
  })
})
