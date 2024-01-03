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

      const prebuildCandidates = [
        `./prebuilds/${process.platform}-${process.arch}/${name}.bare`,
        `./prebuilds/${process.platform}-${process.arch}/${name}@${version}.bare`,
        `./prebuilds/${process.platform}-${process.arch}/${name}.node`,
        `./prebuilds/${process.platform}-${process.arch}/${name}@${version}.node`
      ]

      for (const prebuildCandidate of prebuildCandidates) {
        const prebuildsPath = unixResolve(candidate, prebuildCandidate)
        const prebuilds = await readPrebuilds(drive, prebuildsPath)
        if (prebuilds) return prebuildsPath
      }
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

async function readPrebuilds (drive, path) {
  return drive.entry(path)
}
