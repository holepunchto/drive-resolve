# @Holepunchto/drive-resolve

``` 
npm install drive-resolve
``` 

Asynchronous require resolution in [Hyperdrive](https://github.com/holepunchto/hyperdrive).

## Usage

``` javascript
const resolve = require('@holepunchto/resolve')
const result = await resolve(drive, 'bar')
console.log(result) // /path/to/bar/index.js
```

## API

### async resolve(drive, specifier, opts = {})

`options` include:

``` javascript
{
  basedir: string, // directory to begin resolving from
  extensions: [],   // array of extensions to search
  conditions: [], // array of import conditions
  sourceOverwrites: // source overwrites key-value map (file -> source)
}
```

