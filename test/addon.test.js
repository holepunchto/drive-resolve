const test = require('brittle')
const { addon } = require('../index.js')
const { fixtures } = require('./helpers/index.js')

const host = require.addon ? require.addon.host : process.platform + '-' + process.arch

test('bare prebuilds', async (t) => {
  t.plan(2)
  const name = 'bare-prebuilds'
  const version = '1.0.0'
  {
    const drive = await fixtures()
    await drive.put(`/bare-prebuilds/prebuilds/${host}/${name}@${version}.bare`, Buffer.alloc(1))
    const result = await addon(drive, '/bare-prebuilds')
    t.is(result, `/bare-prebuilds/prebuilds/${host}/bare-prebuilds@1.0.0.bare`)
  }
  {
    const drive = await fixtures()
    await drive.put(`/bare-prebuilds/prebuilds/${host}/${name}.bare`, Buffer.alloc(1))
    const result = await addon(drive, '/bare-prebuilds')
    t.is(result, `/bare-prebuilds/prebuilds/${host}/bare-prebuilds.bare`)
  }
})

test('node prebuilds', async (t) => {
  t.plan(2)
  const name = 'node-prebuilds'
  const version = '1.0.0'
  {
    const drive = await fixtures()
    await drive.put(`/node-prebuilds/prebuilds/${host}/${name}@${version}.node`, Buffer.alloc(1))
    const result = await addon(drive, '/node-prebuilds')
    t.is(result, `/node-prebuilds/prebuilds/${host}/node-prebuilds@1.0.0.node`)
  }
  {
    const drive = await fixtures()
    await drive.put(`/node-prebuilds/prebuilds/${host}/${name}.node`, Buffer.alloc(1))
    const result = await addon(drive, '/node-prebuilds')
    t.is(result, `/node-prebuilds/prebuilds/${host}/node-prebuilds.node`)
  }
})

test('bare prebuilds in parent', async (t) => {
  t.plan(1)
  const name = 'bare-prebuilds'
  const version = '1.0.0'
  const drive = await fixtures()
  await drive.put(`/bare-prebuilds/prebuilds/${host}/${name}@${version}.bare`, Buffer.alloc(1))
  const result = await addon(drive, '/bare-prebuilds/child/path')
  t.is(result, `/bare-prebuilds/prebuilds/${host}/bare-prebuilds@1.0.0.bare`)
})
