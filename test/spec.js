/**
 * cmis
 *
 *    Library test
 */

'use strict'


var assert = require('assert'),
	cmis = require('../lib/cmis').cmis;

var url = "http://cmis.alfresco.com/cmisbrowser";
var username = "admin";
var password = "admin";


describe('CmisJS library test', function() {
  
  it('should connect to a repository', function(done) {
  	cmis.connect(url, username, password).ok(function(res){

  		assert(parseFloat(cmis.repo.cmisVersionSupported)>=.9,
  			"CMIS Version should be at least 1.0");
  		assert(res.ok,"Response should be ok");
  		done();
  	});
  });

  it('should retrieve an object by path', function(done) {
  	cmis.getObjectByPath('/').ok(function(res){
  		assert(res.body.succinctProperties['cmis:name'] !== undefined,'name should not be undefined');
  		done();
  	});
  });

  it('should non found this path', function(done) {
  	cmis.getObjectByPath('/thispathshouldnotexist').notOk(function(res){
  		assert(res.status === 404,'status should be 404');
  		done();
  	});
  });



})
