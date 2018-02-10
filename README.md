CmisJS
======

A CMIS typescript/javascript library for node and browser, with no dependenciel for modern browsers

[![Build Status](https://img.shields.io/travis/agea/CmisJS.svg)](https://travis-ci.org/agea/CmisJS)
[![npm](https://img.shields.io/npm/v/cmis.svg)](https://www.npmjs.com/package/cmis)
![MIT License](https://img.shields.io/npm/l/cmis.svg)

### Breaking API changes in 1.x

You can find the documentation for 0.x versions at: http://agea.github.io/CmisJS/docs_v0.x/

In version 1.x all `CmisSession` methods which connect to repository return a `Promise`

## Install

### npm
```bash
npm install cmis
```
### bower
```bash
bower install cmis
```

#### typescript (node or browser)

```javascript
import { cmis } from cmis;
```

#### javascript (node)

```javascript
var cmis = require('cmis');
```

#### javascript (browser)

If you need polyfills for `fetch` (https://caniuse.com/fetch), `Promise` (https://caniuse.com/promise) and `URLSearchParams` (https://caniuse.com/urlsearchparams) you have to include thid file before including cmis library:

```html
<script src="node_or_bower_path/dist/cmis.polyfills.js"></script>
```

Then, you can include the minified version:
```html
<script src="node_or_bower_path/dist/cmis.bundle.js"></script>
```

#### javascript (CDN)

```html
<script src="//cdn.jsdelivr.net/gh/agea/cmisjs/dist/cmis.polyfills.js"></script>
<script src="//cdn.jsdelivr.net/gh/agea/cmisjs/dist/cmis.bundle.js"></script>
```

## Usage

See: http://agea.github.io/CmisJS/classes/cmis.cmissession.html and https://github.com/agea/CmisJS/blob/master/test/cmis.test.ts


##License

MIT license - [http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php)