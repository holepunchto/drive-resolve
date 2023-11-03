'use strict'

const em = require('exports-map')
const { dirname, join, basename, isAbsolute } = require('path')

module.exports = async (drive, id, opts = {}) => {
  const extensions = opts.extensions ? ['', ...opts.extensions] : ['', '.js'] // always add empty extension
  const basedir = opts.basedir || '/'
  const runtimes = opts.runtimes

  if (id !== basename(id) && id[0] !== '@') { // is path
    let path = ''
    if (isAbsolute(id)) {
      path = id
    } else {
      path = join(basedir, id)
    }
    if (await isDirectory(path)) {
      return resolveDirectory(path)
    } else {
      return checkExtensions(path, [...extensions])
    }
  } else {
    const dirs = getNodeModulesDirs()
    const candidates = dirs.map(e => join(e, id))
    return resolveNodeModules(candidates)
  }

  async function resolveDirectory (path) {
    const pkg = await getPackage(path)
    if (pkg) {
      const main = pkg.main || 'index.js'
      return resolveDirPackageMain(path, main)
    } else {
      const index = join(path, 'index')
      return checkExtensions(index, [...extensions])
    }
  }

  async function resolveNodeModules (candidates) {
    if (!candidates.length) throwModuleNotFound()
    const candidate = candidates.shift()
    const path = candidate
    const pkg = await getPackage(path)
    if (pkg) {
      const main = pkg.main || 'index.js'
      return resolveModulePackageMain(path, main, candidates, candidate)
    } else {
      const index = join(candidate, 'index')
      return (await checkExtensions(index)) || (await resolveNodeModules(candidates))
    }
  }

  async function resolveModulePackageMain (path, main, candidates, candidate) {
    if (await isFile(join(path, main))) {
      return join(path, main)
    } else {
      return (await checkExtensions(join(path, 'index'))) || (await checkExtensions(join(path, main, 'index'))) || throwModuleNotFound()
    }
  }

  async function resolveDirPackageMain (path, main) {
    if (await isFile(join(path, main))) {
      return join(path, main)
    } else {
      return (await checkExtensions(join(path, 'index'))) || (await checkExtensions(join(path, main, 'index'))) || throwModuleNotFound()
    }
  }

  async function checkExtensions (index) {
    const files = await Promise.all(extensions.map(async e => {
      return (await isFile(index + e)) ? index + e : null
    }))
    return files.find(e => e !== null)
  }

  function getNodeModulesDirs () {
    const dirs = []
    const nodeModules = 'node_modules'

    let dir = basedir
    while (dir !== dirname(dir)) {
      dirs.push(join(dir, nodeModules))
      dir = dirname(dir)
    }
    return dirs
  }

  async function getPackage (path, cb) {
    const data = await readFile(join(path, 'package.json'))
    if (data) {
      const pkg = JSON.parse(data.toString())
      if (!pkg.exports || !runtimes) return pkg
      const main = em(pkg.exports, runtimes, '.')
      if (main) pkg.main = main
      return pkg
    } else {
      return null
    }
  }

  async function isFile (file) {
    const node = await drive.entry(file)
    return node !== null && !!(node.value && node.value.blob)
  }

  async function isDirectory (dir, cb) {
    const ite = drive.readdir(dir)[Symbol.asyncIterator]()
    const next = await ite.next()
    return !!next.value
  }

  async function readFile (file) {
    return drive.get(file)
  }

  function throwModuleNotFound () {
    const error = new Error(`Cannot find module '${id}'`)
    error.code = 'MODULE_NOT_FOUND'
    throw error
  }
}
