/**
 * cmis
 *
 *    Library test
 */

'use strict'

root.request = require('superagent');

var assert = require('assert'),

lib = require('../lib/cmis');

var url = "http://localhost:18080/alfresco/cmisbrowser";
var username = "admin";
var password = "admin";


describe('CmisJS library test', function() {
  
  it('should connect to a repository', function(done) {
  	lib.cmis.connect(url, username, password).end(function(res){
  		assert(res.ok,"Response should be ok");
  		done();
  	});
  });

})
