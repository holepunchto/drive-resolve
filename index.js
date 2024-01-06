'use strict'
const resolve = require('bare-module-resolve')
const resolvePrebuilds = require('./resolve-prebuilds.js')
const b4a = require('b4a')

module.exports = async function driveResolve (drive, id, opts = {}) {
  const extensions = opts.extensions || ['.js', '.cjs', '.json', '.mjs']
  const basedir = opts.basedir || '/'
  const conditions = opts.conditions || opts.runtimes /* compat */ || {}
  const sourceOverwrites = opts.sourceOverwrites || {}

  const readPackage = async (packageURL) => {
    const key = fromFileURL(packageURL)

    if (Object.hasOwn(sourceOverwrites, key)) {
      const overwrite = sourceOverwrites[key]
      return JSON.parse(b4a.toString(overwrite))
    }

    const entry = await drive.entry(key)
    if (entry) {
      const file = await drive.get(entry)
      return JSON.parse(b4a.toString(file))
    }

    return null
  }

  const parentURL = toFileURL(basedir[basedir.length - 1] === '/' ? basedir : basedir + '/')

  for await (const moduleURL of resolve(id, parentURL, { extensions, conditions }, readPackage)) {
    const key = fromFileURL(moduleURL)

    if (await drive.entry(key)) {
      return key
    }
  }

  const err = new Error(`Cannot find module '${id}'`)
  err.code = 'MODULE_NOT_FOUND'
  throw err
}

module.exports.prebuilds = resolvePrebuilds

function toFileURL (path) {
  return new URL('file://' + encodeURI(path))
}

function fromFileURL (url) {
  return decodeURI(url.pathname)
}
