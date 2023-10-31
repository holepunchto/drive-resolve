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
        getPkgEntrypoint(path, (pkg) => {
          if (pkg) { // path is dir and has package.json, with or without main
            const main = pkg.main || 'index.js'
            isFile(join(path, main), (err, res) => {
              if (err) return cb(err)
              if (res) { // main is file
                cb(null, join(path, main))
              } else { // main is folder
                const index = join(path, main, 'index')
                checkExtensions(index, [...extensions], cb, () => cb(notFoundError(id, basedir)))
              }
            })
          } else { // path is dir and doesnt have package.json
            const index = join(path, 'index')
            checkExtensions(index, [...extensions], cb, () => cb(notFoundError(id, basedir)))
          }
        })
      } else { // path is file with or without extension
        checkExtensions(path, [...extensions], cb, () => cb(notFoundError(id, basedir)))
      }
    })
  } else {
    // id is not path
    const dirs = getNodeModulesDirs(basedir)
    const candidates = dirs.map(e => join(e, id))
    getPkg(candidates, isFile, extensions, cb)
  }
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

function getPkg (candidates, isFile, extensions, cb) {
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
          extensions.forEach(e => {
            const index = join(candidate, main, 'index' + e)
            isFile(index, (err, res) => {
              if (err) cb(err)
              if (res) cb(null, index)
            })
          })
        } catch (err) {
          // invalid package
          cb(err)
        }
      })
    } else {
      // no package.json in candidate
      extensions.forEach(e => {
        const index = join(candidate, 'index' + e)
        isFile(index, (err, res) => {
          if (err) cb(err)
          if (res) cb(null, index)
        })
      })
    }
    if (candidates.length) getPkg(candidates, isFile, extensions, cb)
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

const defaultIsFile = function isFile (file, cb) {
  fs.stat(file, function (err, stat) {
    if (!err) {
      return cb(null, stat.isFile() || stat.isFIFO())
    }
    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return cb(null, false)
    return cb(err)
  })
}

const defaultIsDir = function isDirectory (dir, cb) {
  fs.stat(dir, function (err, stat) {
    if (!err) {
      return cb(null, stat.isDirectory())
    }
    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return cb(null, false)
    return cb(err)
  })
}

const notFoundError = (id, basedir) => {
  const error = new Error(`Cannot find module '${id}' from '${basedir}'`)
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
  '.node',
  '.coffee'
]
