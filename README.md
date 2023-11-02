# @Holepunchto/drive-resolve

``` 
npm install @holepunchto/drive-resolve
``` 

Synchronous require resolution in [Hyperdrive](https://github.com/holepunchto/hyperdrive).

## Usage

``` javascript
const resolve = require('@holepunchto/resolve')
resolve(drive, 'bar, (err, res) => {
  console.log(err) // /node_modules/bar/index.js
})

```

## API

### resolve(drive, id, opts = {}, callback)

`options` include:

``` javascript
{
  basedir: string, // directory to begin resolving from
  extensions: []   // array of extensions to search
}
```

