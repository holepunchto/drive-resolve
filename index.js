'use strict'
const path = require('path')
const url = require('url')
const resolve = require('bare-module-resolve')

module.exports = async (drive, id, opts = {}) => {
  const extensions = opts.extensions || ['.js', '.cjs', '.json', '.mjs']
  const basedir = opts.basedir || path.sep

  const readPackage = async ({ pathname }) => {
    if (await drive.entry(pathname)) {
      const file = await drive.get(pathname)
      return JSON.parse(file.toString())
    }
  }

  const parentURL = url.pathToFileURL(basedir[basedir.length - 1] === path.sep ? basedir : basedir + '/')

  for await (const { pathname } of resolve(id, parentURL, { extensions }, readPackage)) {
    if (await drive.entry(pathname)) {
      return pathname
    }
  }
}
