const test = require('brittle')
const { prebuilds } = require('../index.js')
const { fixtures } = require('./helpers/index.js')

test('bare prebuilds', async (t) => {
  t.plan(2)
  const name = 'bare-prebuilds'
  const version = '1.0.0'
  {
    const drive = await fixtures()
    await drive.put(`/bare-prebuilds/prebuilds/${process.platform}-${process.arch}/${name}@${version}.bare`, Buffer.alloc(1))
    const result = await prebuilds(drive, '/bare-prebuilds')
    t.is(result, `/bare-prebuilds/prebuilds/${process.platform}-${process.arch}/bare-prebuilds@1.0.0.bare`)
  }
  {
    const drive = await fixtures()
    await drive.put(`/bare-prebuilds/prebuilds/${process.platform}-${process.arch}/${name}.bare`, Buffer.alloc(1))
    const result = await prebuilds(drive, '/bare-prebuilds')
    t.is(result, `/bare-prebuilds/prebuilds/${process.platform}-${process.arch}/bare-prebuilds.bare`)
  }
})

test('node prebuilds', async (t) => {
  t.plan(2)
  const name = 'node-prebuilds'
  const version = '1.0.0'
  {
    const drive = await fixtures()
    await drive.put(`/node-prebuilds/prebuilds/${process.platform}-${process.arch}/${name}@${version}.node`, Buffer.alloc(1))
    const result = await prebuilds(drive, '/node-prebuilds')
    t.is(result, `/node-prebuilds/prebuilds/${process.platform}-${process.arch}/node-prebuilds@1.0.0.node`)
  }
  {
    const drive = await fixtures()
    await drive.put(`/node-prebuilds/prebuilds/${process.platform}-${process.arch}/${name}.node`, Buffer.alloc(1))
    const result = await prebuilds(drive, '/node-prebuilds')
    t.is(result, `/node-prebuilds/prebuilds/${process.platform}-${process.arch}/node-prebuilds.node`)
  }
})

test('bare prebuilds in parent', async (t) => {
  t.plan(1)
  const name = 'bare-prebuilds'
  const version = '1.0.0'
  const drive = await fixtures()
  await drive.put(`/bare-prebuilds/prebuilds/${process.platform}-${process.arch}/${name}@${version}.bare`, Buffer.alloc(1))
  const result = await prebuilds(drive, '/bare-prebuilds/child/path')
  t.is(result, `/bare-prebuilds/prebuilds/${process.platform}-${process.arch}/bare-prebuilds@1.0.0.bare`)
})
