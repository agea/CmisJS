CmisJS
======

A CMIS javascript library for node and browser

[![Build Status](https://img.shields.io/travis/agea/CmisJS.svg)](https://travis-ci.org/agea/CmisJS)
[![npm](https://img.shields.io/npm/v/cmis.svg)](https://www.npmjs.com/package/cmis)
![bower](https://img.shields.io/bower/v/cmis.svg)
![MIT License](https://img.shields.io/npm/l/cmis.svg)

### API changes
Since version 0.3.0 The API for [CmisSession.setContentStream()](http://agea.github.io/CmisJS/docs/#!/api/CmisSession-method-setContentStream) and [CmisSession.appendContentStream()](http://agea.github.io/CmisJS/docs/#!/api/CmisSession-method-appendContentStream) has changed. Please refer to the documentation for details.

## Install

### node.js
```bash
$ npm install cmis
$ node
> var cmis = require('cmis');
```

### bower
```bash
$ bower install cmis
```

#### without bower

You can include directly minified version with dependencies:
```html
<!-- do not use in production -->
<script src="https://rawgit.com/agea/CmisJS/master/min/cmis.min-all.js"></script>
```

## Usage

The entry point for all CMIS operation is the [CmisSession](http://agea.github.io/CmisJS/docs/#!/api/CmisSession)
```javascript
var url = '/alfresco/cmisbrowser';
```

*Note:* you may specify an absolute url if running in node, or using CORS
```javascript
var session = cmis.createSession(url);
```

You may specify your credentials
```javascript
  session.setCredentials('admin','admin');
```

All session methods which connect to a repository are asynchronous, and return a [CmisRequest](http://agea.github.io/CmisJS/docs/#!/api/CmisRequest) object.

You may take a look at the tests to see some usage examples:

[https://github.com/agea/CmisJS/blob/master/test/spec.js](https://github.com/agea/CmisJS/blob/master/test/spec.js)

## Docs

API docs are available here: http://agea.github.io/CmisJS/docs/

## Running tests

Install grunt:
```bash
$ npm install -g grunt-cli
```

Clone the repo:
```bash
$ git clone https://github.com/agea/CmisJS/
```

Install dependencies:
```bash
$ cd CmisJS
$ npm install
```

### Running tests on node

(http://cmis.alfresco.com will be used as test repository)

```bash
$ grunt test
```

You can specify different url, username and password
```bash
$ grunt test --url http://localhost:8080/alfresco/cmisbrowser --username admin --password secret
```

### Running browser tests
```bash
$ grunt server
```

Visit [http://localhost:9000/test](http://localhost:9000/test) in the browser.

Grunt will act as a proxy for http://cmis.alfresco.com, you can specify a different server:
```bash
$ grunt server --host localhost --port 8080 --path /alfresco/cmisbrowser
```

To change username and password you can specify them in the url

[http://localhost:9000/test?username=admin&password=secret](http://localhost:9000/test?username=admin&password=secret)

##License

MIT license - [http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php)
