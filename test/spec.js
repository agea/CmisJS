'use strict'

var url = "http://cmis.alfresco.com/cmisbrowser";
var username = "admin";
var password = "admin";


var assert = require('assert'),
	cmis = require('../lib/cmis').cmis;

if (process.argv.indexOf('--url')!=-1) {
	url = process.argv[process.argv.indexOf('--url')+1];
}

var session = cmis.createSession(url);

describe('CmisJS library test', function() {
  
  it('should connect to a repository', function(done) {
  	session.setCredentials(username, password).loadRepositories()
  		.ok(function(res){
	  		assert(parseFloat(session.defaultRepository.cmisVersionSupported)>=.99,
	  			"CMIS Version should be at least 1.0");
	  		assert(res.ok,"Response should be ok");
	  		done();
	  		});
  });

  var rootId;

  it('should retrieve an object by path', function(done) {
  	session.getObjectByPath('/').ok(function(res){
  		rootId = res.body.succinctProperties['cmis:objectId'];
  		assert(res.body.succinctProperties['cmis:name'] !== undefined,'name should not be undefined');
  		done();
  	});
  });

  it('should retrieve an object by id', function(done) {
  	session.getObject(rootId).ok(function(res){
  		rootId = res.body.succinctProperties['cmis:objectId'];
  		assert(res.body.succinctProperties['cmis:path'] == '/','root object path should be /');
  		done();
  	});
  });

  var randomFolder = "CmisJS" + Math.random();

  it('should non found this path', function(done) {
  	session.getObjectByPath("/" + randomFolder).notOk(function(res){
  		assert(res.status === 404,'status should be 404');
  		done();
  	});
  });

  var randomFolderId;
  it('should create a folder', function(done) {
  	session.createFolder(rootId, randomFolder).ok(function(res){
  		randomFolderId = res.body.succinctProperties['cmis:objectId'];
  		assert(randomFolderId !== undefined,'objectId should be defined');
  		assert(res.status === 201,'status should be 201');
  		done();
  	});
  });

  it('should delete a folder', function(done) {
  	session.deleteObject(randomFolderId, true).ok(function(res){
  		assert(res.status === 200,'status should be 200');
  		done();
  	});
  });




})
