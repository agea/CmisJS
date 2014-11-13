CmisJS
======

A CMIS javascript library for node and browser

[![Build Status](https://travis-ci.org/agea/CmisJS.png?branch=master)](https://travis-ci.org/agea/CmisJS)

## Install

### node.js

    $ npm install cmis
    $ node
    > var cmis = require('cmis');

### browser

You can download minified version (with dependencies) from https://github.com/agea/CmisJS/releases/download/v0.1.8/cmis.0.1.8.min-all.js

	<script type="text/javascript" src="cmis-0.1.8.min-all.js"></script>

*Note:*
You have to include [superagent](http://visionmedia.github.io/) if you want to use [cmis-0.1.8.js](https://github.com/agea/CmisJS/releases/download/v0.1.8/cmis.0.1.8.js) or [cmis-0.1.8.min.js](https://github.com/agea/CmisJS/releases/download/v0.1.8/cmis.0.1.8.min.js)

## Usage

The entry point for all CMIS operation is the [CmisSession](http://agea.github.io/CmisJS/docs/#!/api/CmisSession)

	var url = '/alfresco/cmisbrowser';

*Note:* you may specify an absolute url if running in node, or using CORS

	var session = cmis.createSession(url);

You may specify your credentials

	session.setCredentials('admin','admin');

All session methods which connect to a repository are asynchronous, and return a [CmisRequest](http://agea.github.io/CmisJS/docs/#!/api/CmisRequest) object.

You may take a look at the tests to see some usage examples:

https://github.com/agea/CmisJS/blob/master/test/spec.js

## Docs

API docs are available here: http://agea.github.io/CmisJS/docs/

## Running tests

Install grunt:

    $ npm install -g grunt-cli

Clone the repo:

    $ git clone https://github.com/agea/CmisJS/

Install dependencies:

    $ cd CmisJS

    $ npm install

### Running tests on node

(http://cmis.alfresco.com will be used as test repository)

    $ grunt test

You can specify different url, username and password

    $ grunt test --url http://localhost:8080/alfresco/cmisbrowser --username admin --password secret

### Running browser tests

    $ grunt server

Visit `localhost:9000/test` in the browser.

Grunt will act as a proxy for http://cmis.alfresco.com, you can specify a different server:

	$ grunt server --host localhost --port 8080 --path /alfresco/cmisbrowser

To change username and password you can specify them in the url

	http://localhost:9000/test?username=admin&password=secret

##License

MIT license - [http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php)
