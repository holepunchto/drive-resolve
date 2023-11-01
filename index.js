'use strict'

const { dirname, join, basename, isAbsolute } = require('path')
const fs = require('fs')

module.exports = (id, opts = {}, cb) => {
  const extensions = opts.extensions ? ['', ...opts.extensions] : defaultExtensions // always add empty extension
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
      // console.log('current', current, res)
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
    fs.readFile(join(path, 'package.json'), (err, data) => {
      if (!err) return cb(JSON.parse(data.toString()))
      return cb(null)
    })
  }
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

const defaultExtensions = [
  '',
  '.js',
  '.cjs',
  '.mjs',
  '.json',
  '.bare',
  '.node'
]
