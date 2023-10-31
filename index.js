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
  } else {
    // id is not path
    const dirs = getNodeModulesDirs(basedir)
    const candidates = dirs.map(e => join(e, id))
    resolveNodeModules(candidates, isFile, [...extensions], id, cb)
  }
}

function resolveDir (id, basedir, path, isFile, extensions, cb) {
  getPkgEntrypoint(path, (pkg) => {
    if (pkg) { // path is dir and has package.json, with or without main
      const main = pkg.main || 'index.js'
      if (main === basename(main)) { // main is file
        isFile(join(path, main), (err, res) => {
          if (err) return cb(err)
          if (res) { // main is file
            cb(null, join(path, main))
          } else { // file does not exist
            // TODO throw error
            const index = join(path, 'index')
            checkExtensions(index, [...extensions], cb, () => cb(throwIncorrectPackageMain()))
          }
        })
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
  const pkgPath = join(candidate, 'package.json')
  isFile(pkgPath, (_, res) => {
    if (res) {
      fs.readFile(pkgPath, (err, data) => {
        if (err) cb(err)
        try {
          // candidate has package.json
          const main = JSON.parse(data.toString()).main || 'index.js'
          // main is a file
          isFile(join(candidate, main), (err, res) => {
            if (err) cb(err)
            if (res) cb(null, join(candidate, main))
          })
          // main is a folder, check folder/index[extension]
          const index = join(candidate, main, 'index')
          checkExtensions(index, [...extensions], cb, candidates.length ? noob : () => cb(throwModuleNotFound(id)))
        } catch (err) {
          // invalid package
          cb(err)
        }
      })
    } else {
      const index = join(candidate, 'index')
      checkExtensions(index, [...extensions], cb, candidate.length ? noob : () => cb(throwModuleNotFound(id)))
    }
    if (candidates.length) resolveNodeModules(candidates, isFile, extensions, id, cb)
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
  const nodeModules = 'node_modules' // TODO improve, check is_core_module

  let dir = start

  while (dir !== dirname(dir)) {
    dirs.push(join(dir, nodeModules))
    dir = dirname(dir)
  }
  return dirs
}

function getPkgEntrypoint (id, cb) {
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

function noob () {
  // noob function
}
