'use strict'

const em = require('exports-map')
const unixPathResolve = require('unix-path-resolve')

module.exports = async (drive, id, opts = {}) => {
  const extensions = opts.extensions ? ['', ...opts.extensions] : ['', '.js', '.cjs', '.json', '.mjs'] // always add empty extension
  const basedir = opts.basedir || '/'
  const runtimes = opts.runtimes

  if (basedir === '/' && id.indexOf('..') === 0) {
    id = id.substr(1)
  }

  const isAbsolutePath = id[0] === '/'
  const isRelativePath = id[0] === '.'
  let result

  if (isAbsolutePath || isRelativePath) { // is path
    let path = ''
    if (isAbsolutePath) {
      path = id
    } else {
      path = resolvePath(basedir, id)
    }

    result = await resolveFile(path)
    if (!result || id[id.length - 1] === '/') {
      result = await resolveDirectory(path)
    }
  } else {
    const dirs = getNodeModulesDirs()
    const candidates = dirs.map(e => resolvePath(e, id.split('/')[0]))
    result = await resolveNodeModulesFile(candidates) || await resolveNodeModules(candidates)
  }

  if (result) {
    return result
  } else {
    throwModuleNotFound()
  }

  async function resolveDirectory (path) {
    const pkg = await getDirectoryPackage(path)
    if (pkg) {
      const main = pkg.main || 'index.js'
      if (typeof main !== 'string') throwInvalidMain()
      return resolvePackageMain(path, main)
    } else {
      const index = resolvePath(path, 'index')
      return resolveFile(index)
    }
  }

  async function resolveNodeModules (candidates) {
    if (!candidates.length) return
    const candidate = candidates.shift()
    const path = candidate
    const submodule = getSubmodule(id)
    const pkg = await getNodeModulesPackage(path, submodule)
    if (pkg) {
      const main = pkg.main || 'index.js'
      return resolvePackageMain(path, main, candidates, candidate)
    } else {
      const index = resolvePath(candidate, 'index')
      return (await resolveFile(index)) || (await resolveNodeModules(candidates))
    }
  }

  async function resolvePackageMain (path, main, candidates, candidate) {
    if (await isFile(resolvePath(path, main))) {
      return resolvePath(path, main)
    } else {
      return (await resolveFile(resolvePath(path, main, 'index'))) || (await resolveFile(resolvePath(path, 'index')))
    }
  }

  // TODO this is not deterministic in case of node_modules and node_modules of parent have the same module, make it sequencial

  async function resolveFile (index) {
    const files = await Promise.all(extensions.map(async e => {
      return (await isFile(index + e)) ? index + e : null
    }))
    return files.find(e => e !== null)
  }

  async function resolveNodeModulesFile (candidates) {
    const res = await Promise.all(candidates.map(async c => {
      return resolveFile(c)
    }))
    return res.find(e => e !== undefined)
  }

  function getNodeModulesDirs () {
    const dirs = []
    const nodeModules = 'node_modules'

    let dir = basedir
    while (true) {
      dirs.push(resolvePath(dir, nodeModules))
      if (dir === '/') break
      dir = resolvePath(dir, '..')
    }
    return dirs
  }

  async function getNodeModulesPackage (id, submodule) {
    const data = await readFile(resolvePath(id, 'package.json'))
    if (data) {
      const pkg = JSON.parse(data.toString())
      if (!pkg.exports || !runtimes) return pkg
      const main = em(pkg.exports, runtimes, submodule)
      if (main) pkg.main = main
      return pkg
    } else {
      return null
    }
  }

  async function getDirectoryPackage (path) {
    const data = await readFile(resolvePath(path, 'package.json'))
    if (data) {
      return JSON.parse(data.toString())
    } else {
      return null
    }
  }

  async function isFile (file) {
    const node = await drive.entry(file)
    return node !== null && !!(node.value && node.value.blob)
  }

  async function readFile (file) {
    return drive.get(file)
  }

  function throwModuleNotFound () {
    const error = new Error(`Cannot find module '${id}'`)
    error.code = 'MODULE_NOT_FOUND'
    throw error
  }

  function throwInvalidMain () {
    const error = new Error(`Package ${id} main must be a string`)
    error.code = 'INVALID_PACKAGE_MAIN'
    throw error
  }
}

function resolvePath (...args) {
  if (args.length === 1) {
    return unixPathResolve(args[0])
  } else {
    const last = args.pop()
    return unixPathResolve(resolvePath(...args), last)
  }
}

function getSubmodule (id) {
  const submodule = id.split('/')
  submodule.shift()
  return submodule.join('/')
}
