'use strict'

const { dirname, join, basename, isAbsolute } = require('path')

module.exports = (drive, id, opts = {}, cb) => {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  const extensions = opts.extensions ? ['', ...opts.extensions] : defaultExtensions // always add empty extension
  const isFile = opts.isFile || defaultIsFile
  const isDir = opts.isDir || defaultIsDir
  const readFile = opts.readFile || defaultReadFile
  const basedir = opts.basedir || '/'

  if (id !== basename(id)) { // is path
    let path = ''
    if (isAbsolute(id)) {
      path = id
    } else {
      path = join(basedir, id)
    }
    isDir(path, (err, res) => {
      if (err) return cb(err)
      if (res) { // path is dir
        resolveDir(path)
      } else { // path is file with or without extension
        checkExtensions(path, [...extensions], () => cb(throwNotFound(id, basedir)))
      }
    })
  } else { // id is not path
    const dirs = getNodeModulesDirs()
    const candidates = dirs.map(e => join(e, id))
    resolveNodeModules(candidates)
  }

  function resolveDir (path) {
    getPackage(path, (pkg) => {
      if (pkg) { // has package.json
        const main = pkg.main || 'index.js'
        resolveDirPackageMain(path, main)
      } else { // path is dir and doesnt have package.json
        const index = join(path, 'index')
        checkExtensions(index, [...extensions], () => cb(throwNotFound(id, basedir)))
      }
    })
  }

  function resolveNodeModules (candidates) {
    const candidate = candidates.shift()
    const path = candidate
    getPackage(path, (pkg) => {
      if (pkg) { // has package.json
        const main = pkg.main || 'index.js'
        resolveModulePackageMain(id, path, main, [...extensions], candidates, candidate, isFile, cb)
      } else { // path is dir and doesnt have package.json
        const index = join(candidate, 'index')
        const callback = candidates.length ? () => resolveNodeModules(candidates, isFile, [...extensions], id, cb) : () => cb(throwModuleNotFound(id))
        checkExtensions(index, [...extensions], callback)
      }
    })
  }

  function resolveModulePackageMain (id, path, main, extensions, candidates, candidate, isFile, cb) {
    isFile(join(path, main), (err, res) => {
      if (err) return cb(err)
      if (res) {
        cb(null, join(path, main))
      } else {
        const index = join(path, 'index')
        checkExtensions(index, [...extensions], () => {
          const index = join(candidate, main, 'index') // main is not a file, try finding the index
          const callback = candidates.length ? () => resolveNodeModules(candidates, isFile, [...extensions], id, cb) : () => cb(throwModuleNotFound(id))
          checkExtensions(index, [...extensions], callback)
        })
      }
    })
  }

  function resolveDirPackageMain (path, main) {
    isFile(join(path, main), (err, res) => {
      if (err) return cb(err)
      if (res) {
        cb(null, join(path, main))
      } else {
        const index = join(path, 'index')
        checkExtensions(index, [...extensions], () => {
          const index = join(path, main, 'index')
          checkExtensions(index, [...extensions], () => cb(throwNotFound(id, basedir)))
        })
      }
    })
  }

  function checkExtensions (index, extensions, fallback) {
    if (extensions.length === 0) return fallback()
    const current = index + extensions.shift()
    isFile(current, (err, res) => {
      if (err) return cb(err)
      if (res) {
        return cb(null, current)
      } else {
        checkExtensions(index, extensions, fallback)
      }
    })
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

  function getPackage (path, cb) {
    readFile(join(path, 'package.json'), (err, data) => {
      if (!err && data) return cb(JSON.parse(data.toString())) // TODO check is well-formed
      return cb(null)
    })
  }

  function defaultIsFile (file, cb) {
    drive.entry(file).then((node) => {
      cb(null, node !== null && !!(node.value && node.value.blob))
    })
  }

  function defaultIsDir (dir, cb) {
    const ite = drive.readdir(dir)[Symbol.asyncIterator]()
    ite.next().then(({ value }) => {
      cb(null, value !== null)
    })
  }

  function defaultReadFile (file, cb) {
    drive.get(file).then((res) => {
      cb(null, res)
    })
  }
}

function throwNotFound (id, basedir) {
  const error = new Error(`Cannot find module '${id}' from '${basedir}'`)
  error.code = 'MODULE_NOT_FOUND'
  return error
}

function throwModuleNotFound (id, basedir) {
  const error = new Error(`Cannot find module '${id}'`)
  error.code = 'MODULE_NOT_FOUND'
  return error
}

const defaultExtensions = [
  '',
  '.js',
  '.cjs',
  '.mjs',
  '.json',
  '.bare',
  '.node'
]
