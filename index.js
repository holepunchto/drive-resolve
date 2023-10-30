const { dirname, join, basename, isAbsolute } = require('path')
const fs = require('fs')

module.exports = (id, opts = {}, cb) => {
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
      isFile(path + e, (err, res) => {
        if (err) cb(err)
        if (res) cb(null, path + e)
      })
    })
    isDir(path, (err, res) => {
      if (err) cb(err)
      getPkgEntrypoint(path, (err, pkg) => {
        if (err) cb(err)
        const main = pkg.main || 'index.js'
        if (res) cb(null, join(path, main))
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
    if (!err) cb(err, JSON.parse(data.toString()))
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
