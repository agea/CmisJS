CmisJS
======

A CMIS javascript library for node and browser - [![Build Status](https://travis-ci.org/agea/CmisJS.png?branch=master)](https://travis-ci.org/agea/CmisJS)

## Running tests

Install grunt:

	$ npm install -g grunt-cli

Install dependencies:

	$ npm install

### Running tests on node
   
(http://cmis.alfresco.com will be used as test repository)

    $ grunt test

You can specify different url, username and password 

    $ grunt test --url http://localhost:8080/alfresco/cmisbrowser --user admin --password secret

### Running browser tests

    $ grunt server

Visit `localhost:9000/test` in the browser.

Grunt will act as a proxy for http://cmis.alfresco.com, you can specify a different server:

	$ grunt server --host localhost --port 8080 --path /alfresco/cmisbrowser

To change username and password you can specify them in the url

	http://localhost:9000/test?username=admin&password=secret

