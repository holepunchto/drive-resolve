const Hyperdrive = require('hyperdrive')
const RAM = require('random-access-memory')
const Corestore = require('corestore')
const { basename, join } = require('path')
const { stat, readFile, readdir } = require('fs/promises')

async function createDriveFromDir (dir) {
  const store = new Corestore(RAM)
  await store.ready()
  const drive = new Hyperdrive(store)
  await drive.ready()

  const files = await readAllFiles(dir, join('/', basename(dir)), [])
  for await (const file of files) {
    drive.put(file.relativePath, (await readFile(file.absolutePath)))
  }

  return drive

  async function readAllFiles (dir, subpath, arr = []) {
    const files = await readdir(dir)
    await Promise.all(files.map(async (file) => {
      if ((await stat(join(dir, file))).isDirectory()) {
        arr = arr.concat(await readAllFiles(join(dir, file), join(subpath, file), arr))
      } else {
        arr.push({ relativePath: join(subpath, file), absolutePath: join(dir, file) })
      }
    }))
    return arr
  }
}

module.exports = {
  createDriveFromDir
}
