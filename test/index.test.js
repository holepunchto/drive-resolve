const path = require('path')
const test = require('brittle')
const resolve = require('../index.js')
const { mirror } = require('./helpers/index.js')

test('resolves absolute dir', async (t) => {
  t.plan(1)

  const drive = await mirror(path.join(__dirname, 'fixtures'))
  const id = '/relative/path'
  const result = await resolve(drive, id)
  t.is(result, path.join(id, 'index.js'))
})

test('resolves absolute file', async (t) => {
  t.plan(1)

  const drive = await mirror(path.join(__dirname, 'fixtures'))
  const id = '/relative/path/index.js'
  const result = await resolve(drive, id)
  t.is(result, id)
})

test('resolves relative path', async (t) => {
  t.plan(2)

  const drive = await mirror(path.join(__dirname, 'fixtures'))

  {
    const id = './relative/path'
    const result = await resolve(drive, id)
    t.is(result, '/relative/path/index.js')
  }
  {
    const id = '../relative/path'
    const result = await resolve(drive, id)
    t.is(result, '/relative/path/index.js')
  }
})

test('package.json main', async (t) => {
  t.plan(1)

  const drive = await mirror(path.join(__dirname, 'fixtures'))
  const id = '/main'
  const result = await resolve(drive, id)
  t.is(result, path.join(id, 'main.js'))
})

test('package.json main is folder', async (t) => {
  t.plan(1)

  const drive = await mirror(path.join(__dirname, 'fixtures'))
  const id = '/main-is-folder'
  const result = await resolve(drive, id)
  t.is(result, path.join(id, '/lib/index.js'))
})

test('resolves without extension', async (t) => {
  t.plan(1)

  const drive = await mirror(path.join(__dirname, 'fixtures'))
  const id = '/relative/path/index'
  const result = await resolve(drive, id)
  t.is(result, id + '.js')
})

test('resolves relative path with/without extension', async (t) => {
  t.plan(2)

  const drive = await mirror(path.join(__dirname, 'fixtures'))
  const dir = '/resolver'

  {
    const result = await resolve(drive, './foo', { basedir: dir })
    t.is(result, path.join(dir, 'foo.js'))
  }

  {
    const result = await resolve(drive, './foo.js', { basedir: dir })
    t.is(result, path.join(dir, 'foo.js'))
  }
})

test('resolves by module name from basedir', async (t) => {
  t.plan(1)

  const drive = await mirror(path.join(__dirname, 'fixtures'))
  const dir = '/resolver'

  const result = await resolve(drive, 'foo', { basedir: dir + '/bar' })
  t.is(result, path.join(dir, 'bar/node_modules/foo/index.js'))
})

test('resolves main with relative path', async (t) => {
  t.plan(1)

  const drive = await mirror(path.join(__dirname, 'fixtures'))
  const dir = '/resolver'

  const result = await resolve(drive, './baz', { basedir: dir })
  t.is(result, path.join(dir, 'baz/quux.js'))
})

test('resolves to parent node_modules with module name and relative path', async (t) => {
  t.plan(6)

  const drive = await mirror(path.join(__dirname, 'fixtures'))
  const dir = '/resolver/biz/node_modules'

  {
    const result = await resolve(drive, './grux', { basedir: dir })
    t.is(result, path.join(dir, 'grux/index.js'))
  }

  {
    const result = await resolve(drive, './garply', { basedir: dir })
    t.is(result, path.join(dir, 'garply/lib/index.js'))
  }

  {
    const result = await resolve(drive, 'tiv', { basedir: dir + '/grux' })
    t.is(result, path.join(dir, 'tiv/index.js'))
  }

  {
    const result = await resolve(drive, 'tiv', { basedir: dir + '/garply' })
    t.is(result, path.join(dir, 'tiv/index.js'))
  }

  {
    const result = await resolve(drive, 'grux', { basedir: dir + '/tiv' })
    t.is(result, path.join(dir, 'grux/index.js'))
  }

  {
    const result = await resolve(drive, 'garply', { basedir: dir + '/tiv' })
    t.is(result, path.join(dir, 'garply/lib/index.js'))
  }
})

test('resolves without package.json', async (t) => {
  t.plan(1)

  const drive = await mirror(path.join(__dirname, 'fixtures'))
  const dir = '/resolver/quux'

  const result = await resolve(drive, './foo', { basedir: dir })
  t.is(result, path.join(dir, 'foo/index.js'))
})

test('resolves using parent folder path', async (t) => {
  t.plan(1)

  const drive = await mirror(path.join(__dirname, 'fixtures'))
  const dir = '/resolver/biz/node_modules/grux'

  const result = await resolve(drive, '../grux', { basedir: dir })
  t.is(result, path.join(dir, 'index.js'))
})

test.skip('custom extension and opts.extensions work', async (t) => {
  t.plan(4)

  const drive = await mirror(path.join(__dirname, 'fixtures'))
  const dir = '/resolver'

  {
    const result = await resolve(drive, './cup', { basedir: dir, extensions: ['.js', '.coffee'] })
    t.is(result, path.join(dir, 'cup.coffee'))
  }

  {
    const result = await resolve(drive, './cup.coffee', { basedir: dir })
    t.is(result, path.join(dir, 'cup.coffee'))
  }

  try {
    resolve(drive, './cup', { basedir: dir, extensions: ['.js'] })
  } catch (err) {
    t.is(err.message, "Cannot find module './cup' from '" + path.resolve(dir) + "'")
    t.is(err.code, 'MODULE_NOT_FOUND')
  }
})

test('by default resolves to .js extension unless specified in opts.extensions', async (t) => {
  t.plan(3)

  const drive = await mirror(path.join(__dirname, 'fixtures'))
  const dir = '/resolver'

  {
    const result = await resolve(drive, './mug', { basedir: dir })
    t.is(result, path.join(dir, 'mug.js'))
  }

  {
    const result = await resolve(drive, './mug', { basedir: dir, extensions: ['.coffee', '.js'] })
    t.is(result, path.join(dir, '/mug.coffee'))
  }

  {
    const result = await resolve(drive, './mug', { basedir: dir, extensions: ['.js', '.coffee'] })
    t.is(result, path.join(dir, '/mug.js'))
  }
})

test('resolves to index.js when main is empty', async (t) => {
  t.plan(1)

  const drive = await mirror(path.join(__dirname, 'fixtures'))
  const resolverDir = '/resolver'
  const dir = path.join(resolverDir, 'empty_main')

  const result = await resolve(drive, './empty_main', { basedir: resolverDir })
  t.is(result, path.join(dir, 'index.js'))
})

test('resolves to index.js when main is incorrect', async (t) => {
  t.plan(1)

  const drive = await mirror(path.join(__dirname, 'fixtures'))
  const resolverDir = '/resolver'
  const dir = path.join(resolverDir, 'incorrect_main')

  const result = await resolve(drive, './incorrect_main', { basedir: resolverDir })
  t.is(result, path.join(dir, 'index.js'))
})

test('returns error if index is missing', async (t) => {
  t.plan(2)

  const drive = await mirror(path.join(__dirname, 'fixtures'))
  const resolverDir = '/resolver'
  try {
    await resolve(drive, './missing_index', { basedir: resolverDir })
  } catch (err) {
    t.ok(err instanceof Error)
    t.is(err && err.code, 'MODULE_NOT_FOUND', 'error has correct error code')
  }
})

test('resolves to index.js if no main in package.json', async (t) => {
  t.plan(1)

  const drive = await mirror(path.join(__dirname, 'fixtures'))
  const resolverDir = '/resolver'
  const dir = path.join(resolverDir, 'missing_main')

  const result = await resolve(drive, './missing_main', { basedir: resolverDir })
  t.is(result, path.join(dir, 'index.js'))
})

test('resolves to index.js if main is null in package.json', async (t) => {
  t.plan(1)

  const drive = await mirror(path.join(__dirname, 'fixtures'))
  const resolverDir = '/resolver'
  const dir = path.join(resolverDir, 'null_main')

  const result = await resolve(drive, './null_main', { basedir: resolverDir })
  t.is(result, path.join(dir, 'index.js'))
})
