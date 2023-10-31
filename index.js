'use strict'

const { dirname, join, basename, isAbsolute } = require('path')
const fs = require('fs')

module.exports = (id, opts = {}, cb) => {
  const extensions = opts.extensions || defaultExtensions
  const isFile = opts.isFile || defaultIsFile
  const isDir = opts.isDir || defaultIsDir
  const basedir = opts.basedir
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
        resolveDir(id, basedir, path, isFile, extensions, cb)
      } else { // path is file with or without extension
        checkExtensions(path, [...extensions], cb, () => cb(throwNotFound(id, basedir)))
      }
    })
  } else { // id is not path
    const dirs = getNodeModulesDirs(basedir)
    const candidates = dirs.map(e => join(e, id))
    resolveNodeModules(candidates, isFile, [...extensions], id, cb)
  }
}

function resolveDir (id, basedir, path, isFile, extensions, cb) {
  getPackage(path, (pkg) => {
    if (pkg) { // has package.json
      const main = pkg.main || 'index.js'
      if (main === basename(main)) { // main is file
        resolvePackageMain(path, main, [...extensions], isFile, cb)
      } else { // main is dir
        const index = join(path, main, 'index')
        checkExtensions(index, [...extensions], cb, () => cb(throwNotFound(id, basedir)))
      }
    } else { // path is dir and doesnt have package.json
      const index = join(path, 'index')
      checkExtensions(index, [...extensions], cb, () => cb(throwNotFound(id, basedir)))
    }
  })
}

function resolveNodeModules (candidates, isFile, extensions, id, cb) {
  const candidate = candidates.shift()
  const path = candidate
  getPackage(path, (pkg) => {
    if (pkg) { // has package.json
      const main = pkg.main || 'index.js'
      if (main === basename(main)) { // main is file
        resolvePackageMain(path, main, [...extensions], isFile, cb)
      } else { // main is dir
        const index = join(candidate, main, 'index')
        const callback = candidates.length ? () => resolveNodeModules(candidates, isFile, [...extensions], id, cb) : () => cb(throwModuleNotFound(id))
        checkExtensions(index, [...extensions], cb, callback)
      }
    } else { // path is dir and doesnt have package.json
      const index = join(candidate, 'index')
      const callback = candidates.length ? () => resolveNodeModules(candidates, isFile, [...extensions], id, cb) : () => cb(throwModuleNotFound(id))
      checkExtensions(index, [...extensions], cb, callback)
    }
  })
}

function resolvePackageMain (path, main, extensions, isFile, cb) {
  isFile(join(path, main), (err, res) => {
    if (err) return cb(err)
    if (res) {
      cb(null, join(path, main))
    } else {
      // TODO throw error here (main does not exist and no index.js)
      const index = join(path, 'index')
      checkExtensions(index, [...extensions], cb, () => cb(throwIncorrectPackageMain()))
    }
  })
}

function checkExtensions (index, extensions, cb, notFound) {
  if (extensions.length === 0) return notFound()
  const current = index + extensions.shift()
  defaultIsFile(current, (err, res) => {
    if (err) return cb(err)
    if (res) {
      return cb(null, current)
    } else {
      checkExtensions(index, extensions, cb, notFound)
    }
  })
}

function getNodeModulesDirs (start) {
  const dirs = []
  const nodeModules = 'node_modules'

  let dir = start

  while (dir !== dirname(dir)) {
    dirs.push(join(dir, nodeModules))
    dir = dirname(dir)
  }
  return dirs
}

function getPackage (id, cb) {
  fs.readFile(join(id, 'package.json'), (err, data) => {
    if (!err) return cb(JSON.parse(data.toString()))
    return cb(null)
  })
}

function defaultIsFile (file, cb) {
  fs.stat(file, function (err, stat) {
    if (!err) {
      return cb(null, stat.isFile() || stat.isFIFO())
    }
    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return cb(null, false)
    return cb(err)
  })
}

function defaultIsDir (dir, cb) {
  fs.stat(dir, function (err, stat) {
    if (!err) {
      return cb(null, stat.isDirectory())
    }
    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return cb(null, false)
    return cb(err)
  })
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

function throwIncorrectPackageMain () {
  const error = new Error()
  error.code = 'INCORRECT_PACKAGE_MAIN'
  return error
}

const defaultExtensions = [
  '',
  '.js',
  '.cjs',
  '.mjs',
  '.json',
  '.bare',
  '.node',
  '.coffee'
]
