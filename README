# @Holepunchto/resolve

Synchronous require resolution in [Hyperdrive](https://github.com/holepunchto/hyperdrive).

## Usage

```
const resolve = require('@holepunchto/resolve')
resolve(drive, 'bar, (err, res) => {
  console.log(err) // /node_modules/bar/index.js
})

```

## API

### resolve(drive, id, opts = {}, callback)

`options` include:

```
{
  basedir: string, // directory to begin resolving from
  extensions: [], // array of extensions to search
  isFile: (file, callback) => {}, // synchronous check if file exists
  isDir: (dir, callback) => {}, // synchronous check if dir exists
  readFile: (file, callback) => {} // synchronous read file
}
```

