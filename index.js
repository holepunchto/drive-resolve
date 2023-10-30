const { dirname, join, basename, isAbsolute } = require('path')
const fs = require('fs')

const extensions = [
  '',
  '.js',
  '.cjs',
  '.mjs',
  '.json',
  '.bare',
  '.node'
]

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
    // path is file with or without extension
    extensions.forEach(e => {
      isFile(path + e, (err, res) => {
        if (err) cb(err)
        if (res) cb(null, path + e)
      })
    })
    // path is folder
    isDir(path, (err, res) => {
      if (err) cb(err)
      getPkgEntrypoint(path, (pkg) => {
        if (pkg) {
          // path is dir and has package.json, with or without main
          const main = pkg.main || 'index.js'
          // main is file
          isFile(join(path, main), (err, res) => {
            if (err) cb(err)
            if (res) cb(null, join(path, main))
          })
          // main is folder
          extensions.forEach(e => {
            const index = join(path, main, 'index' + e)
            isFile(index, (err, res) => {
              if (err) cb(err)
              if (res) cb(null, index)
            })
          })
        } else {
          // path is dir and doesnt have package.json
          extensions.forEach(e => {
            const index = join(path, 'index' + e)
            isFile(index, (err, res) => {
              if (err) cb(err)
              if (res) cb(null, index)
            })
          })
        }
      })
    })
  } else {
    // id is not path
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
    if (candidates.length) getPkg(candidates, isFile, cb)
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
    if (!err) cb(JSON.parse(data.toString()))
    cb(null)
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
