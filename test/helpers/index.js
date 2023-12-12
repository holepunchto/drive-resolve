const path = require('path')
const Hyperdrive = require('hyperdrive')
const RAM = require('random-access-memory')
const LocalDrive = require('localdrive')
const Corestore = require('corestore')
const Mirror = require('mirror-drive')

async function mirror (dir) {
  const store = new Corestore(RAM.reusable())
  await store.ready()
  const drive = new Hyperdrive(store)
  await drive.ready()

  const dst = drive
  const src = new LocalDrive(dir)
  const opts = { batch: true }
  const mirror = new Mirror(src, dst, opts)
  await mirror.done()
  return dst
}

async function fixtures () {
  return mirror(path.join(__dirname, '..', 'fixtures'))
}

module.exports = {
  mirror,
  fixtures
}
