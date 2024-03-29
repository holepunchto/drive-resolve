const test = require('brittle')
const resolve = require('../index.js')
const { fixtures } = require('./helpers/index.js')

test('resolves absolute dir', async (t) => {
  t.plan(1)

  const drive = await fixtures()
  const id = '/relative/path'
  const result = await resolve(drive, id)
  t.is(result, id + '/index.js')
})

test('resolves absolute file', async (t) => {
  t.plan(1)

  const drive = await fixtures()
  const id = '/relative/path/index.js'
  const result = await resolve(drive, id)
  t.is(result, id)
})

test('resolves relative path', async (t) => {
  t.plan(2)

  const drive = await fixtures()

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

  const drive = await fixtures()
  const id = '/main'
  const result = await resolve(drive, id)
  t.is(result, id + '/main.js')
})

test('package.json main is folder', async (t) => {
  t.plan(1)

  const drive = await fixtures()
  const id = '/main-is-folder'
  const result = await resolve(drive, id)
  t.is(result, id + '/lib/index.js')
})

test('resolves without extension', async (t) => {
  t.plan(1)

  const drive = await fixtures()
  const id = '/relative/path/index'
  const result = await resolve(drive, id)
  t.is(result, id + '.js')
})

test('resolves relative path with/without extension', async (t) => {
  t.plan(2)

  const drive = await fixtures()
  const dir = '/resolver'

  {
    const result = await resolve(drive, './foo', { basedir: dir })
    t.is(result, dir + '/foo.js')
  }

  {
    const result = await resolve(drive, './foo.js', { basedir: dir })
    t.is(result, dir + '/foo.js')
  }
})

test('resolves by module name from basedir', async (t) => {
  t.plan(1)

  const drive = await fixtures()
  const dir = '/resolver'

  const result = await resolve(drive, 'foo', { basedir: dir + '/bar' })
  t.is(result, dir + '/bar/node_modules/foo/index.js')
})

test('resolves main with relative path', async (t) => {
  t.plan(1)

  const drive = await fixtures()
  const dir = '/resolver'

  const result = await resolve(drive, './baz', { basedir: dir })
  t.is(result, dir + '/baz/quux.js')
})

test('resolves to parent node_modules with module name and relative path', async (t) => {
  t.plan(6)

  const drive = await fixtures()
  const dir = '/resolver/biz/node_modules'

  {
    const result = await resolve(drive, './grux', { basedir: dir })
    t.is(result, dir + '/grux/index.js')
  }

  {
    const result = await resolve(drive, './garply', { basedir: dir })
    t.is(result, dir + '/garply/lib/index.js')
  }

  {
    const result = await resolve(drive, 'tiv', { basedir: dir + '/grux' })
    t.is(result, dir + '/tiv/index.js')
  }

  {
    const result = await resolve(drive, 'tiv', { basedir: dir + '/garply' })
    t.is(result, dir + '/tiv/index.js')
  }

  {
    const result = await resolve(drive, 'grux', { basedir: dir + '/tiv' })
    t.is(result, dir + '/grux/index.js')
  }

  {
    const result = await resolve(drive, 'garply', { basedir: dir + '/tiv' })
    t.is(result, dir + '/garply/lib/index.js')
  }
})

test('resolves without package.json', async (t) => {
  t.plan(1)

  const drive = await fixtures()
  const dir = '/resolver/quux'

  const result = await resolve(drive, './foo', { basedir: dir })
  t.is(result, dir + '/foo/index.js')
})

test('resolves using parent folder path', async (t) => {
  t.plan(1)

  const drive = await fixtures()
  const dir = '/resolver/biz/node_modules/grux'

  const result = await resolve(drive, '../grux', { basedir: dir })
  t.is(result, dir + '/index.js')
})

test('custom extensions', async (t) => {
  t.plan(4)

  const drive = await fixtures()
  const dir = '/resolver'

  {
    const result = await resolve(drive, './cup.coffee', { basedir: dir, extensions: ['.js', '.coffee'] })
    t.is(result, dir + '/cup.coffee')
  }

  {
    const result = await resolve(drive, './cup.cjs', { basedir: dir })
    t.is(result, dir + '/cup.cjs')
  }

  try {
    await resolve(drive, './cup', { basedir: dir, extensions: ['.js'] })
  } catch (err) {
    t.is(err.message, "Cannot find module './cup'")
    t.is(err.code, 'MODULE_NOT_FOUND')
  }
})

test('by default resolves to .js extension unless specified in opts.extensions', async (t) => {
  t.plan(3)

  const drive = await fixtures()
  const dir = '/resolver'

  {
    const result = await resolve(drive, './mug', { basedir: dir })
    t.is(result, dir + '/mug.js')
  }

  {
    const result = await resolve(drive, './mug', { basedir: dir, extensions: ['.coffee', '.js'] })
    t.is(result, dir + '/mug.coffee')
  }

  {
    const result = await resolve(drive, './mug', { basedir: dir, extensions: ['.js', '.coffee'] })
    t.is(result, dir + '/mug.js')
  }
})

test('resolves to index.js when main is empty', async (t) => {
  t.plan(1)

  const drive = await fixtures()
  const resolverDir = '/resolver'
  const dir = resolverDir + '/empty_main'

  const result = await resolve(drive, './empty_main', { basedir: resolverDir })
  t.is(result, dir + '/index.js')
})

test('returns error if index is missing', async (t) => {
  t.plan(2)

  const drive = await fixtures()
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

  const drive = await fixtures()
  const resolverDir = '/resolver'
  const dir = resolverDir + '/missing_main'

  const result = await resolve(drive, './missing_main', { basedir: resolverDir })
  t.is(result, dir + '/index.js')
})

test('resolves to index.js if main is null in package.json', async (t) => {
  t.plan(1)

  const drive = await fixtures()
  const resolverDir = '/resolver'
  const dir = resolverDir + '/null_main'

  const result = await resolve(drive, './null_main', { basedir: resolverDir })
  t.is(result, dir + '/index.js')
})

test('main is false', async (t) => {
  t.plan(1)

  const drive = await fixtures()
  const basedir = '/resolver'
  const result = await resolve(drive, './false_main', { basedir })
  t.is(result, basedir + '/false_main/index.js')
})

test('main is false', async (t) => {
  t.plan(1)

  const drive = await fixtures()
  const basedir = '/resolver'
  const result = await resolve(drive, './false_main', { basedir })
  t.is(result, basedir + '/false_main/index.js')
})

test(' resolves module-paths like "./someFolder/" when there is a file of the same name', async (t) => {
  t.plan(2)

  const drive = await fixtures()
  const basedir = '/resolver/same_names'

  {
    const result = await resolve(drive, './foo/', { basedir })
    t.is(result, '/resolver/same_names/foo/index.js')
  }

  {
    const result = await resolve(drive, './foo', { basedir })
    t.is(result, '/resolver/same_names/foo.js')
  }
})

test('resolves module-paths like "." when from inside a folder with a sibling file of the same name', async (t) => {
  t.plan(2)

  const drive = await fixtures()
  const dir = '/resolver'
  const basedir = '/resolver/same_names/foo'

  {
    const result = await resolve(drive, './', { basedir })
    t.is(result, dir + '/same_names/foo/index.js')
  }
  {
    const result = await resolve(drive, '.', { basedir })
    t.is(result, dir + '/same_names/foo/index.js')
  }
})

test('conditional exports', async (t) => {
  t.plan(4)

  const drive = await fixtures()
  {
    const result = await resolve(drive, 'conditional-exports')
    t.is(result, '/node_modules/conditional-exports/index.cjs.js')
  }
  {
    const runtimes = ['require']
    const result = await resolve(drive, 'conditional-exports/submodule.js', { runtimes })
    t.is(result, '/node_modules/conditional-exports/prod/index.cjs.js')
  }
  {
    const runtimes = ['node']
    const result = await resolve(drive, 'conditional-exports/conditional.js', { runtimes })
    t.is(result, '/node_modules/conditional-exports/feature-node.js')
  }
  {
    const runtimes = ['default']
    const result = await resolve(drive, 'conditional-exports/conditional.js', { runtimes })
    t.is(result, '/node_modules/conditional-exports/feature.js')
  }
})

test('resolves node module file directory', async (t) => {
  t.plan(2)
  {
    const drive = await fixtures()
    const result = await resolve(drive, '@foo/bar/index')
    t.is(result, '/node_modules/@foo/bar/index.js')
  }
  {
    const drive = await fixtures()
    const result = await resolve(drive, '@foo/bar/biz')
    t.is(result, '/node_modules/@foo/bar/biz/index.js')
  }
})

test('resolves dot and double dot from basedir /', async (t) => {
  t.plan(4)
  {
    const drive = await fixtures()
    const result = await resolve(drive, '.')
    t.is(result, '/index.js')
  }
  {
    const drive = await fixtures()
    const result = await resolve(drive, '..')
    t.is(result, '/index.js')
  }
  {
    const drive = await fixtures()
    const result = await resolve(drive, '..', { basedir: '/main' })
    t.is(result, '/index.js')
  }
  try {
    const drive = await fixtures()
    await resolve(drive, './wrong.js')
  } catch (err) {
    t.is(err.code, 'MODULE_NOT_FOUND')
  }
})
