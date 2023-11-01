const { dirname, join } = require('path')
const path = require('path')
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

test('baz', function (t) {
  t.plan(1)
  const dir = join(__dirname, 'resolver')

  resolve('./baz', { basedir: dir }, function (err, res) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'baz/quux.js'))
  })
})

test('biz', function (t) {
  t.plan(6)
  const dir = join(__dirname, 'resolver/biz/node_modules')

  resolve('./grux', { basedir: dir }, function (err, res, pkg) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'grux/index.js'))
  })

  resolve('./garply', { basedir: dir }, function (err, res, pkg) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'garply/lib/index.js'))
  })

  resolve('tiv', { basedir: dir + '/grux' }, function (err, res, pkg) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'tiv/index.js'))
  })

  resolve('tiv', { basedir: dir + '/garply' }, function (err, res, pkg) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'tiv/index.js'))
  })

  resolve('grux', { basedir: dir + '/tiv' }, function (err, res, pkg) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'grux/index.js'))
  })

  resolve('garply', { basedir: dir + '/tiv' }, function (err, res, pkg) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'garply/lib/index.js'))
  })
})

test('quux', function (t) {
  t.plan(1)
  const dir = join(__dirname, 'resolver/quux')

  resolve('./foo', { basedir: dir }, function (err, res, pkg) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'foo/index.js'))
  })
})

test('normalize', function (t) {
  t.plan(1)
  const dir = join(__dirname, 'resolver/biz/node_modules/grux')

  resolve('../grux', { basedir: dir }, function (err, res) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'index.js'))
  })
})

test('cup', function (t) {
  t.plan(4)
  const dir = join(__dirname, 'resolver')

  resolve('./cup', { basedir: dir, extensions: ['.js', '.coffee'] }, function (err, res) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'cup.coffee'))
  })

  resolve('./cup.coffee', { basedir: dir }, function (err, res) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'cup.coffee'))
  })

  resolve('./cup', { basedir: dir, extensions: ['.js'] }, function (err, res) {
    t.is(err.message, "Cannot find module './cup' from '" + path.resolve(dir) + "'")
    t.is(err.code, 'MODULE_NOT_FOUND')
  })
})

test('mug', function (t) {
  t.plan(3)
  const dir = join(__dirname, 'resolver')

  resolve('./mug', { basedir: dir }, function (err, res) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'mug.js'))
  })

  resolve('./mug', { basedir: dir, extensions: ['.coffee', '.js'] }, function (err, res) {
    if (err) t.fail(err)
    t.is(res, join(dir, '/mug.coffee'))
  })

  resolve('./mug', { basedir: dir, extensions: ['.js', '.coffee'] }, function (err, res) {
    if (err) t.fail(err)
    t.is(res, join(dir, '/mug.js'))
  })
})

test('empty main', function (t) {
  t.plan(1)

  const resolverDir = join(__dirname, 'resolver')
  const dir = join(resolverDir, 'empty_main')

  resolve('./empty_main', { basedir: resolverDir }, function (err, res, pkg) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'index.js'))
  })
})

test('incorrect main', function (t) {
  t.plan(1)

  const resolverDir = join(__dirname, 'resolver')
  const dir = join(resolverDir, 'incorrect_main')

  resolve('./incorrect_main', { basedir: resolverDir }, function (err, res, pkg) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'index.js'))
  })
})

test('missing index', function (t) {
  t.plan(2)

  const resolverDir = join(__dirname, 'resolver')
  resolve('./missing_index', { basedir: resolverDir }, function (err, res, pkg) {
    t.ok(err instanceof Error)
    t.is(err && err.code, 'MODULE_NOT_FOUND', 'error has correct error code')
  })
})

test('missing main', function (t) {
  t.plan(1)

  const resolverDir = join(__dirname, 'resolver')
  const dir = join(resolverDir, 'missing_main')

  resolve('./missing_main', { basedir: resolverDir }, function (err, res, pkg) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'index.js'))
  })
})

test('null main', function (t) {
  t.plan(1)

  const resolverDir = join(__dirname, 'resolver')
  const dir = join(resolverDir, 'null_main')

  resolve('./null_main', { basedir: resolverDir }, function (err, res, pkg) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'index.js'))
  })
})

test('resolve brittle', (t) => {
  t.plan(2)
  resolve('brittle', { basedir: __dirname }, (err, result) => {
    t.is(err, null)
    t.is(result, join(path.dirname(__dirname), 'node_modules', 'brittle', 'index.js'))
  })
})

test('resolve acorn', (t) => {
  t.plan(2)
  resolve('acorn', { basedir: __dirname }, (err, result) => {
    t.is(err, null)
    t.is(result, join(path.dirname(__dirname), 'node_modules', 'acorn', 'dist', 'acorn.js'))
  })
})
