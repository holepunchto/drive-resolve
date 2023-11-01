const { join } = require('path')
const path = require('path')
const test = require('brittle')
const resolve = require('../index.js')
const { createDriveFromDir } = require('./helpers/index.js')

test('resolves absolute dir', async (t) => {
  t.plan(2)

  const drive = await createDriveFromDir(join(__dirname, 'fixtures'))
  const id = '/fixtures/relative/path'
  resolve(drive, id, (err, result) => {
    t.is(err, null)
    t.is(result, join(id, 'index.js'))
  })
})

test('resolves absolute file', async (t) => {
  t.plan(2)

  const drive = await createDriveFromDir(join(__dirname, 'fixtures'))
  const id = '/fixtures/relative/path/index.js'
  resolve(drive, id, (err, result) => {
    t.is(err, null)
    t.is(result, id)
  })
})

test('resolves relative path', async (t) => {
  t.plan(4)

  const drive = await createDriveFromDir(join(__dirname, 'fixtures'))

  {
    const id = './fixtures/relative/path'
    resolve(drive, id, (err, result) => {
      t.is(err, null)
      t.is(result, '/fixtures/relative/path/index.js')
    })
  }
  {
    const id = '../fixtures/relative/path'
    resolve(drive, id, (err, result) => {
      t.is(err, null)
      t.is(result, '/fixtures/relative/path/index.js')
    })
  }
})

test('package.json main', async (t) => {
  t.plan(2)

  const drive = await createDriveFromDir(join(__dirname, 'fixtures'))
  const id = '/fixtures/main'
  resolve(drive, id, (err, result) => {
    t.is(err, null)
    t.is(result, join(id, 'main.js'))
  })
})

test('package.json main is folder', async (t) => {
  t.plan(2)

  const drive = await createDriveFromDir(join(__dirname, 'fixtures'))
  const id = '/fixtures/main-is-folder'
  resolve(drive, id, (err, result) => {
    t.is(err, null)
    t.is(result, join(id, '/lib/index.js'))
  })
})

test('no extension', async (t) => {
  t.plan(2)

  const drive = await createDriveFromDir(join(__dirname, 'fixtures'))
  const id = '/fixtures/relative/path/index'
  resolve(drive, id, (err, result) => {
    t.is(err, null)
    t.is(result, id + '.js')
  })
})

test('async foo', async (t) => {
  t.plan(2)

  const drive = await createDriveFromDir(join(__dirname, 'fixtures'))
  const dir = '/fixtures/resolver'

  resolve(drive, './foo', { basedir: dir }, function (err, res) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'foo.js'))
  })

  resolve(drive, './foo.js', { basedir: dir }, function (err, res) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'foo.js'))
  })
})

test('bar', async (t) => {
  t.plan(1)

  const drive = await createDriveFromDir(join(__dirname, 'fixtures'))
  const dir = '/fixtures/resolver'

  resolve(drive, 'foo', { basedir: dir + '/bar' }, function (err, res, pkg) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'bar/node_modules/foo/index.js'))
  })
})

test('baz', async (t) => {
  t.plan(1)

  const drive = await createDriveFromDir(join(__dirname, 'fixtures'))
  const dir = '/fixtures/resolver'

  resolve(drive, './baz', { basedir: dir }, function (err, res) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'baz/quux.js'))
  })
})

test('biz', async (t) => {
  t.plan(6)

  const drive = await createDriveFromDir(join(__dirname, 'fixtures'))
  const dir = '/fixtures/resolver/biz/node_modules'

  resolve(drive, './grux', { basedir: dir }, function (err, res) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'grux/index.js'))
  })

  resolve(drive, './garply', { basedir: dir }, function (err, res) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'garply/lib/index.js'))
  })

  resolve(drive, 'tiv', { basedir: dir + '/grux' }, function (err, res) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'tiv/index.js'))
  })

  resolve(drive, 'tiv', { basedir: dir + '/garply' }, function (err, res) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'tiv/index.js'))
  })

  resolve(drive, 'grux', { basedir: dir + '/tiv' }, function (err, res) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'grux/index.js'))
  })

  resolve(drive, 'garply', { basedir: dir + '/tiv' }, function (err, res) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'garply/lib/index.js'))
  })
})

test('quux', async (t) => {
  t.plan(1)

  const drive = await createDriveFromDir(join(__dirname, 'fixtures'))
  const dir = '/fixtures/resolver/quux'

  resolve(drive, './foo', { basedir: dir }, function (err, res, pkg) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'foo/index.js'))
  })
})

test('normalize', async (t) => {
  t.plan(1)

  const drive = await createDriveFromDir(join(__dirname, 'fixtures'))
  const dir = '/fixtures/resolver/biz/node_modules/grux'

  resolve(drive, '../grux', { basedir: dir }, function (err, res) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'index.js'))
  })
})

test('cup', async (t) => {
  t.plan(4)

  const drive = await createDriveFromDir(join(__dirname, 'fixtures'))
  const dir = '/fixtures/resolver'

  resolve(drive, './cup', { basedir: dir, extensions: ['.js', '.coffee'] }, function (err, res) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'cup.coffee'))
  })

  resolve(drive, './cup.coffee', { basedir: dir }, function (err, res) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'cup.coffee'))
  })

  resolve(drive, './cup', { basedir: dir, extensions: ['.js'] }, function (err, res) {
    t.is(err.message, "Cannot find module './cup' from '" + path.resolve(dir) + "'")
    t.is(err.code, 'MODULE_NOT_FOUND')
  })
})

test('mug', async (t) => {
  t.plan(3)

  const drive = await createDriveFromDir(join(__dirname, 'fixtures'))
  const dir = '/fixtures/resolver'

  resolve(drive, './mug', { basedir: dir }, function (err, res) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'mug.js'))
  })

  resolve(drive, './mug', { basedir: dir, extensions: ['.coffee', '.js'] }, function (err, res) {
    if (err) t.fail(err)
    t.is(res, join(dir, '/mug.coffee'))
  })

  resolve(drive, './mug', { basedir: dir, extensions: ['.js', '.coffee'] }, function (err, res) {
    if (err) t.fail(err)
    t.is(res, join(dir, '/mug.js'))
  })
})

test('empty main', async (t) => {
  t.plan(1)

  const drive = await createDriveFromDir(join(__dirname, 'fixtures'))
  const resolverDir = '/fixtures/resolver'
  const dir = join(resolverDir, 'empty_main')

  resolve(drive, './empty_main', { basedir: resolverDir }, function (err, res, pkg) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'index.js'))
  })
})

test('incorrect main', async (t) => {
  t.plan(1)

  const drive = await createDriveFromDir(join(__dirname, 'fixtures'))
  const resolverDir = '/fixtures/resolver'
  const dir = join(resolverDir, 'incorrect_main')

  resolve(drive, './incorrect_main', { basedir: resolverDir }, function (err, res, pkg) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'index.js'))
  })
})

test('missing index', async (t) => {
  t.plan(2)

  const drive = await createDriveFromDir(join(__dirname, 'fixtures'))
  const resolverDir = '/fixtures/resolver'
  resolve(drive, './missing_index', { basedir: resolverDir }, function (err, res, pkg) {
    t.ok(err instanceof Error)
    t.is(err && err.code, 'MODULE_NOT_FOUND', 'error has correct error code')
  })
})

test('missing main', async (t) => {
  t.plan(1)

  const drive = await createDriveFromDir(join(__dirname, 'fixtures'))
  const resolverDir = '/fixtures/resolver'
  const dir = join(resolverDir, 'missing_main')

  resolve(drive, './missing_main', { basedir: resolverDir }, function (err, res, pkg) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'index.js'))
  })
})

test('null main', async (t) => {
  t.plan(1)

  const drive = await createDriveFromDir(join(__dirname, 'fixtures'))
  const resolverDir = '/fixtures/resolver'
  const dir = join(resolverDir, 'null_main')

  resolve(drive, './null_main', { basedir: resolverDir }, function (err, res, pkg) {
    if (err) t.fail(err)
    t.is(res, join(dir, 'index.js'))
  })
})
