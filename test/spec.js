'use strict'

var url = "http://cmis.alfresco.com/cmisbrowser";
var username = "admin";
var password = "admin";


var assert = require('assert'),
	cmis = require('../lib/cmis').cmis;

if (process.argv.indexOf('--url')!=-1) {
	url = process.argv[process.argv.indexOf('--url')+1];
}

if (process.argv.indexOf('--username')!=-1) {
	username = process.argv[process.argv.indexOf('--username')+1];
}

if (process.argv.indexOf('--password')!=-1) {
	password = process.argv[process.argv.indexOf('--password')+1];
}

var session = cmis.createSession(url);

session.setGlobalHandlers(console.log, console.log);

describe('CmisJS library test', function () {
  
  it('should connect to a repository', function (done) {
  	session.setCredentials(username, password).loadRepositories()
  		.ok(function (res){
	  		assert(parseFloat(session.defaultRepository.cmisVersionSupported)>=.99,
	  			"CMIS Version should be at least 1.0");
	  		assert(res.ok,"Response should be ok");
	  		done();
	  		});
  });

  it('should get repository informations', function (done) {
  	session.getRepositoryInfo()
  		.ok(function (res){
  			var id = session.defaultRepository.repositoryId;
  			assert(id == res.body[id].repositoryId, "id should be the same");
	  		assert(res.ok,"Response should be ok");
	  		done();
	  		});
  });

  it('should get type children definitions', function (done) {
  	session.getTypeChildren()
  		.ok(function (res){
  			assert(res.body.numItems>0, "Some types should be defined");
	  		assert(res.ok,"Response should be ok");
	  		done();
	  		});
  });

  it('should get type descendants definitions', function (done) {
  	session.getTypeDescendants(null, 5)
  		.ok(function (res){
	  		assert(res.ok,"Response should be ok");
	  		done();
	  		});
  });

  it('should get type definition', function (done) {
  	session.getTypeDefinition('cmis:document')
  		.ok(function (res){
  			assert(res.body.propertyDefinitions['cmis:name']!==undefined,
  				"cmis:document should have cmis:name property")
	  		assert(res.ok,"Response should be ok");
	  		done();
	  		});
  });

  it('should get checked out documents', function (done) {
  	session.getCheckedOutDocs()
  		.ok(function (res){
  			assert(res.body.objects!==undefined, "objects should be defined");
	  		assert(res.ok,"Response should be ok");
	  		done();
	  		});
  });

  it('should query the repository', function (done) {
  	session.query("select * from cmis:document",false,{maxItems:3})
  		.ok(function (res){
  			assert(res.body.results.length==3,'Should find 3 documents');
	  		assert(res.ok,"Response should be ok");
	  		done();
	  		});
  });

  var testType = {
	id:'test:testDoc',
	baseId:'cmis:document',
	parentId:'cmis:document',
	displayName:'Test Document',
	description:'Test Document Type',
	localNamespace:'local',
	localName:'test:testDoc',
	queryName:'test:testDoc',
	fileable:true,
	includedInSupertypeQuery:true,
    creatable:true,
    fulltextIndexed:false,
    queryable:false,
    controllableACL:true,
    controllablePolicy:false,
    propertyDefinitions:{
        'test:aString':{
            id:'test:aString',
            localNamespace:'local',
            localName:'test:aString',
            queryName:'test:aString',
            displayName:'A String',
            description:'This is a String.',
            propertyType:'string',
            updatability:'readwrite',
            inherited:false,
            openChoice:false,
            required:false,
            cardinality:'single',
            queryable:true,
            orderable:true,
        	} 
    	}
	}

  it('should create a new type', function (done) {
  	session.createType(testType).ok(function (res){
	  	assert(res.ok,"Response should be ok");
  		done();
  	}).notOk(function (res) {
  		assert(res.body.exception=='notSupported', "not supported");
  		console.log("Content creation is not supportedi n this repository")
  		done();
  	});
  });

  it('should update a type', function (done) {
  	session.updateType(testType).ok(function (res){
  		testType.displayName = 'A Modified test document';
	  	assert(res.ok,"Response should be ok");
  		done();
  	}).notOk(function (res) {
  		assert(res.body.exception=='notSupported', "not supported");
  		console.log("Content update is not supported in this repository")
  		done();
  	});
  });

  it('should delete a type', function (done) {
  	session.deleteType(testType.id).ok(function (res){
	  	assert(res.ok,"Response should be ok");
  		done();
  	}).notOk(function (res) {
  		assert(res.body.exception=='notSupported', "not supported");
  		console.log("Content deletion is not supported in this repository")
  		done();
  	});
  });

  var rootId;

  it('should retrieve an object by path', function (done) {
  	session.getObjectByPath('/').ok(function (res){
  		rootId = res.body.succinctProperties['cmis:objectId'];
  		assert(res.body.succinctProperties['cmis:name'] !== undefined,'name should not be undefined');
  		done();
  	});
  });

  it('should retrieve an object by id', function (done) {
  	session.getObject(rootId).ok(function (res){
  		rootId = res.body.succinctProperties['cmis:objectId'];
  		assert(res.body.succinctProperties['cmis:path'] == '/','root object path should be /');
  		done();
  	});
  });

  var randomFolder = "CmisJS" + Math.random();

  it('should non found this path', function (done) {
  	session.getObjectByPath("/" + randomFolder).notOk(function (res){
  		assert(res.status === 404,'status should be 404');
  		done();
  	});
  });

  var randomFolderId;
  it('should create a folder', function (done) {
  	session.createFolder(rootId, randomFolder).ok(function (res){
  		randomFolderId = res.body.succinctProperties['cmis:objectId'];
  		assert(randomFolderId !== undefined,'objectId should be defined');
  		assert(res.status === 201,'status should be 201');
  		done();
  	});
  });

  it('should return object children', function (done) {
  	session.getChildren(rootId).ok(function (res){
  		var found = false;
  		for (var i = res.body.objects.length - 1; i >= 0; i--) {
  			found = (res.body.objects[i].object.succinctProperties['cmis:objectId']==randomFolderId);
  			if(found){
  				break;
  			}
  		}
  		assert(found, "Should found created folder");
  		done();
  	});
  });



  it('should delete a folder', function (done) {
  	session.deleteObject(randomFolderId, true).ok(function (res){
  		assert(res.status === 200,'status should be 200');
  		done();
  	});
  });

  it('should get latest changes', function (done) {
  session.getContentChanges(session.defaultRepository.latestChangeLogToken)
  	.ok(function (res){
		assert(res.body.objects!==undefined, "objects should be defined");
  		assert(res.ok,"Response should be ok");
  		done();
  		});
  });





})
