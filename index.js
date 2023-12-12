'use strict'
const path = require('path')
const url = require('url')
const resolve = require('bare-module-resolve')
const b4a = require('b4a')

module.exports = async (drive, id, opts = {}) => {
  const extensions = opts.extensions || ['.js', '.cjs', '.json', '.mjs']
  const basedir = opts.basedir || path.sep
  const conditions = opts.runtimes
  const sourceOverwrites = opts.sourceOverwrites || {}

  const readPackage = async (packageURL) => {
    const pathname = url.fileURLToPath(packageURL)

    if (Object.hasOwn(sourceOverwrites, pathname)) {
      const overwrite = sourceOverwrites[pathname]
      return JSON.parse(b4a.toString(overwrite))
    }

    const entry = await drive.entry(pathname)
    if (entry) {
      const file = await drive.get(entry)
      return JSON.parse(b4a.toString(file))
    }

    return null
  }

  const parentURL = url.pathToFileURL(basedir[basedir.length - 1] === path.sep ? basedir : basedir + path.sep)

  for await (const moduleURL of resolve(id, parentURL, { extensions, conditions }, readPackage)) {
    const pathname = url.fileURLToPath(moduleURL)

    if (await drive.entry(pathname)) {
      return pathname
    }
  }

  const err = new Error(`Cannot find module '${id}'`)
  err.code = 'MODULE_NOT_FOUND'
  throw err
}
