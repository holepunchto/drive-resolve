'use strict'
const resolve = require('bare-module-resolve')

module.exports = async (drive, id, opts = {}) => {
  const extensions = opts.extensions || ['.js', '.cjs', '.json', '.mjs']
  const basedir = opts.basedir || '\\'

  const readPackage = async ({ pathname }) => {
    if (await drive.entry(pathname)) {
      const file = await drive.get(pathname)
      return JSON.parse(file.toString())
    }
  }

  for await (const { pathname } of resolve(id, new URL('file://' + basedir), { extensions }, readPackage)) {
    if (await drive.entry(pathname)) {
      return pathname
    }
  }
}
