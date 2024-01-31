const b4a = require('b4a')
const resolve = require('bare-addon-resolve')
const host = require.addon ? require.addon.host : process.platform + '-' + process.arch

module.exports = async function resolveAddon (drive, basedir) {
  const readPackage = async (packageURL) => {
    const key = fromFileURL(packageURL)
    const entry = await drive.entry(key)
    if (entry) {
      const file = await drive.get(entry)
      return JSON.parse(b4a.toString(file))
    }
    return null
  }

  const parentURL = toFileURL(basedir[basedir.length - 1] === '/' ? basedir : basedir + '/')

  for await (const addonURL of resolve('.', parentURL, { name: null, version: null, host, extensions: ['.bare', '.node'] }, readPackage)) {
    const key = fromFileURL(addonURL)

    if (await drive.entry(key)) {
      return key
    }
  }
}

function toFileURL (path) {
  return new URL('file://' + encodeURI(path))
}

function fromFileURL (url) {
  return decodeURI(url.pathname)
}
