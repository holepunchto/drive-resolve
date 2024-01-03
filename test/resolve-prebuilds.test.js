const test = require('brittle')
const resolvePrebuilds = require('../resolve-prebuilds')
const { fixtures } = require('./helpers/index.js')

test('bare prebuilds', async (t) => {
  t.plan(2)
  const name = 'bare-prebuilds'
  const version = '1.0.0'
  {
    const drive = await fixtures()
    await drive.put(`/bare-prebuilds/prebuilds/${process.platform}-${process.arch}/${name}@${version}.bare`, Buffer.alloc(1))
    const result = await resolvePrebuilds(drive, '/bare-prebuilds/prebuilds')
    t.is(result, `/bare-prebuilds/prebuilds/${process.platform}-${process.arch}/bare-prebuilds@1.0.0.bare`)
  }
  {
    const drive = await fixtures()
    await drive.put(`/bare-prebuilds/prebuilds/${process.platform}-${process.arch}/${name}.bare`, Buffer.alloc(1))
    const result = await resolvePrebuilds(drive, '/bare-prebuilds/prebuilds')
    t.is(result, `/bare-prebuilds/prebuilds/${process.platform}-${process.arch}/bare-prebuilds.bare`)
  }
})

test('node prebuilds', async (t) => {
  t.plan(2)
  const name = 'node-prebuilds'
  const version = '1.0.0'
  {
    const drive = await fixtures()
    await drive.put(`/node-prebuilds/prebuilds/${process.platform}-${process.arch}/${name}@${version}.bare`, Buffer.alloc(1))
    const result = await resolvePrebuilds(drive, '/node-prebuilds/prebuilds')
    t.is(result, `/node-prebuilds/prebuilds/${process.platform}-${process.arch}/node-prebuilds@1.0.0.bare`)
  }
  {
    const drive = await fixtures()
    await drive.put(`/node-prebuilds/prebuilds/${process.platform}-${process.arch}/${name}.bare`, Buffer.alloc(1))
    const result = await resolvePrebuilds(drive, '/node-prebuilds/prebuilds')
    t.is(result, `/node-prebuilds/prebuilds/${process.platform}-${process.arch}/node-prebuilds.bare`)
  }
})
