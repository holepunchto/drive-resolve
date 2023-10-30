const { dirname, join } = require('path')
const test = require('brittle')
const resolve = require('../index.js').sync

test('resolves abosute path', (t) => {
  const path = '/absolute/path'
  const result = resolve(path)
  t.is(result, path)
})

test('resolves relative path', (t) => {
  {
    const path = './relative/path'
    const result = resolve(path)
    t.is(result, join(dirname(__dirname), '/lib/relative/path'))
  }
  {
    const path = '../relative/path'
    const result = resolve(path)
    t.is(result, join(dirname(__dirname), '/relative/path'))
  }
})
