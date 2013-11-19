'use strict'

var assert = require('assert'),
	cmis = require('../lib/cmis').cmis;

var url = "http://localhost:18080/alfresco/cmisbrowser";
var username = "admin";
var password = "admin";

describe('CmisJS library test', function() {
  
  it('should connect to a repository', function(done) {
  	cmis.connect(url, username, password).ok(function(res){

  		assert(parseFloat(cmis.repo.cmisVersionSupported)>=.99,
  			"CMIS Version should be at least 1.0");
  		assert(res.ok,"Response should be ok");
  		done();
  	}).error(function(){
  		cmis.connect("http://cmis.alfresco.com/cmisbrowser", username, password).ok(function(res){

  		assert(parseFloat(cmis.repo.cmisVersionSupported)>=.99,
  			"CMIS Version should be at least 1.0");
  		assert(res.ok,"Response should be ok");
  		done();
  	})
  	});
  });

  var rootId;

  it('should retrieve an object by path', function(done) {
  	cmis.getObjectByPath('/').ok(function(res){
  		rootId = res.body.succinctProperties['cmis:objectId'];
  		assert(res.body.succinctProperties['cmis:name'] !== undefined,'name should not be undefined');
  		done();
  	});
  });

  it('should retrieve an object by id', function(done) {
  	cmis.getObject(rootId).ok(function(res){
  		rootId = res.body.succinctProperties['cmis:objectId'];
  		assert(res.body.succinctProperties['cmis:path'] == '/','root object path should be /');
  		done();
  	});
  });

  var randomFolder = "CmisJS" + Math.random();

  it('should non found this path', function(done) {
  	cmis.getObjectByPath("/" + randomFolder).notOk(function(res){
  		assert(res.status === 404,'status should be 404');
  		done();
  	});
  });

  var randomFolderId;
  it('should create a folder', function(done) {
  	cmis.createFolder(rootId, randomFolder).ok(function(res){
  		randomFolderId = res.body.succinctProperties['cmis:objectId'];
  		assert(randomFolderId !== undefined,'objectId should be defined');
  		assert(res.status === 201,'status should be 201');
  		done();
  	});
  });

  it('should delete a folder', function(done) {
  	cmis.deleteObject(randomFolderId, true).ok(function(res){
  		assert(res.status === 200,'status should be 200');
  		done();
  	});
  });




})
