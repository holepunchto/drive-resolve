'use strict'

const em = require('exports-map')
const unixPathResolve = require('unix-path-resolve')
const b4a = require('b4a')

module.exports = async (drive, id, opts = {}) => {
  const extensions = opts.extensions ? ['', ...opts.extensions] : ['', '.js', '.cjs', '.json', '.mjs'] // always add empty extension
  const basedir = opts.basedir || '/'
  const runtimes = opts.runtimes
  const sourceOverwrites = opts.sourceOverwrites || null

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
    const module = getModuleId(id)
    const fileCandidates = dirs.map(e => resolvePath(e, id))
    const directoryCandidates = dirs.map(e => resolvePath(e, id))
    const moduleCandidates = dirs.map(e => resolvePath(e, module))
    result = await resolveNodeModulesFile(fileCandidates) ||
      await resolveNodeModulesDirectory(directoryCandidates) ||
      await resolveNodeModules(moduleCandidates)
  }

  if (result) {
    return result
  }

  throwModuleNotFound()

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

  async function resolveFile (index) {
    for (let i = 0; i < extensions.length; i++) {
      const file = await isFile(index + extensions[i])
      if (file) return index + extensions[i]
    }
  }

  async function resolveNodeModulesFile (candidates) {
    for (let i = 0; i < candidates.length; i++) {
      const file = await resolveFile(candidates[i])
      if (file) return file
    }
  }

  async function resolveNodeModulesDirectory (candidates) {
    for (let i = 0; i < candidates.length; i++) {
      const directory = await resolveDirectory(candidates[i])
      if (directory) return directory
    }
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
    const file = await isFile(resolvePath(id, 'package.json')) && await readFile(resolvePath(id, 'package.json'))
    if (file) {
      const pkg = JSON.parse(file.toString())
      if (!pkg.exports || !runtimes) return pkg
      const main = em(pkg.exports, runtimes, submodule)
      if (main) pkg.main = main
      return pkg
    } else {
      return null
    }
  }

  async function getDirectoryPackage (path) {
    const file = await isFile(resolvePath(path, 'package.json')) && await readFile(resolvePath(path, 'package.json'))
    if (file) {
      return JSON.parse(file.toString())
    } else {
      return null
    }
  }

  async function isFile (file) {
    const node = await drive.entry(file)
    return node !== null && !!(node.value && node.value.blob)
  }

  async function readFile (name) {
    if (sourceOverwrites !== null && Object.hasOwn(sourceOverwrites, name)) {
      const overwrite = sourceOverwrites[name]
      return typeof overwrite === 'string' ? b4a.from(overwrite) : overwrite
    }

    const src = await drive.get(name)
    return src
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

function getModuleId (id) {
  if (id[0] === '@') {
    return id.split('/')[0] + '/' + id.split('/')[1]
  } else {
    return id.split('/')[0]
  }
}

function getSubmodule (id) {
  const submodule = id.substr(getModuleId(id).length + 1)
  if (submodule.length === 0) {
    return '.'
  } else {
    if (submodule.indexOf('./') === 0) {
      return submodule
    } else {
      return './' + submodule
    }
  }
}
