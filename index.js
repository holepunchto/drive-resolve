const { dirname, join, basename, isAbsolute } = require('path')
const fs = require('fs')
const os = require('os')

module.exports = (req, opts = {}, cb) => {
  const isFile = opts.isFile || defaultIsFile
  const isDir = opts.isDir || defaultIsDir
  const basedir = opts.basedir
  const id = (req === '..' || req === '.') ? join(basedir, req) : req

  if (id !== basename(id)) { // is path
    let path = ''
    if (isAbsolute(id)) {
      path = id
    } else {
      path = join(basedir, id)
    }

    isDir(basedir, (err, res) => { // first lets check if basedir is valid
      if (err || !res) {
        const error = new Error('Provided basedir "' + basedir + '" is not a directory')
        error.code = 'INVALID_BASEDIR'
        cb(error)
      }

      const extensions = [
        '',
        '.js',
        '.cjs',
        '.mjs',
        '.json',
        '.bare',
        '.node'
      ]

      extensions.forEach(e => {
        isFile(path, (err, res) => {
          if (err) cb(err)
          if (res) cb(null, path + e)
        })
      })

      isDir(path, (err, res) => {
        if (err) cb(err)
        getPkgEntrypoint(path, (err, pkg) => {
          const main = !err && pkg.main ? pkg.main : 'index.js'
          if (res) cb(null, join(path, main))
        })
      })
    })

  } else {
    const dirs = getNodeModulesDirs(basedir)
    const candidates = dirs.map(e => join(e, id))
    getPkg(candidates, isFile, cb)
  }
}

function getPkg (candidates, isFile, cb) {
  const candidate = candidates.shift()
  const pkgPath = join(candidate, 'package.json')
  isFile(pkgPath, (_, res) => {
    if (res) {
      fs.readFile(pkgPath, (err, data) => {
        if (err) cb(err)
        try {
          const main = JSON.parse(data.toString()).main
          if (!err) cb(null, join(candidate, main))
        } catch (err) {
          cb(err)
        }
      })
    } else {
      if (candidates.length) getPkg(candidates, isFile, cb)
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

function getPkgEntrypoint (id, cb) {
  fs.readFile(join(id, 'package.json'), (err, data) => {
    if (err) {
      cb(err)
    } else {
      cb(null, JSON.parse(data.toString()))
    }
  })
}

// TODO this is temporary will be changed with hyperdrive API

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
