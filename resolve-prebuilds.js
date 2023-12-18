const path = require('path')
const b4a = require('b4a')
const unixResolve = require('unix-path-resolve')

module.exports = async function resolvePrebuilds (drive, basedir) {
  const candidates = getCandidates(basedir)
  while (candidates.length) {
    const candidate = candidates.pop()
    const pkg = await readPackage(drive, candidate)
    if (pkg) {
      const name = pkg.name
      const version = pkg.version
      const prebuildsPath = unixResolve(candidate, `./prebuilds/${process.arch}/${name}@${version}`)
      const prebuilds = await readPrebuilds(drive, prebuildsPath, '.node') || await readPrebuilds(drive, prebuildsPath, '.bare')
      if (prebuilds) return prebuilds
    }
  }
}

function getCandidates (basedir) {
  const candidates = []
  candidates.unshift(path.dirname(basedir))
  while (candidates[0] !== '/') {
    candidates.unshift(path.dirname(candidates[0]))
  }
  return candidates
}

async function readPackage (drive, path) {
  const entry = await drive.entry(unixResolve(path, './package.json'))
  if (entry) {
    const file = await drive.get(entry)
    return JSON.parse(b4a.toString(file))
  }

  return null
}

async function readPrebuilds (drive, path, extension) {
  return drive.entry(path + extension)
}
