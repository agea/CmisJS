'use strict'

var url = url || "http://cmis.alfresco.com/cmisbrowser";
var username = "admin";
var password = "admin";

var isNode = false;

if (typeof module !== 'undefined' && module.exports) {
  isNode = true;
}

if (isNode){

  var Stream = require('stream');

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
} else {

  console.log(url);

  var q = window.location.search.substring(1).split('&');

  for (var i=0; i<q.length;i++){

    var p = q[i].split();

    if (p[0]=='username'){
      username = p[1];
    }
    if (p[0]=='password'){
      password = p[1];
    }
  }
}


var session = cmis.createSession(url);

session.setGlobalHandlers(console.log, console.log);

describe('CmisJS library test', function () {
  
  it('should connect to a repository', function (done) {
  	session.setCredentials(username, password).loadRepositories()
  		.ok(function (res){
	  		assert(parseFloat(session.defaultRepository.cmisVersionSupported)>=.99,
	  			"CMIS Version should be at least 1.0");
        if (!isNode) {
          session.defaultRepository.repositoryUrl = session.defaultRepository.repositoryUrl.substring(session.defaultRepository.repositoryUrl.indexOf('/cmisbrowser'));
          session.defaultRepository.rootFolderUrl = session.defaultRepository.rootFolderUrl.substring(session.defaultRepository.rootFolderUrl.indexOf('/cmisbrowser'));
        }
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
  		console.log("Type creation is not supportedi n this repository")
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
  		console.log("Type update is not supported in this repository")
  		done();
  	});
  });

  it('should delete a type', function (done) {
  	session.deleteType(testType.id).ok(function (res){
	  	assert(res.ok,"Response should be ok");
  		done();
  	}).notOk(function (res) {
  		assert(res.body.exception=='notSupported', "not supported");
  		console.log("Type deletion is not supported in this repository")
  		done();
  	});
  });

  var rootId;

  it('should retrieve an object by path', function (done) {
  	session.getObjectByPath('/').ok(function (res){
  		rootId = res.body.succinctProperties['cmis:objectId'];
  		assert(res.body.succinctProperties['cmis:name'] !== undefined,
  			'name should not be undefined');
  		done();
  	});
  });

  it('should retrieve an object by id', function (done) {
  	session.getObject(rootId).ok(function (res){
  		rootId = res.body.succinctProperties['cmis:objectId'];
  		assert(res.body.succinctProperties['cmis:path'] == '/',
  			'root object path should be /');
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
  var firstChildId;
  var secondChildId;
  it('should create some folders', function (done) {
  	session.createFolder(rootId, randomFolder).ok(function (res){
  		randomFolderId = res.body.succinctProperties['cmis:objectId'];
	  	session.createFolder(randomFolderId, 'First Level').ok(function (res2){
	  		firstChildId = res2.body.succinctProperties['cmis:objectId'];
		  	session.createFolder(firstChildId, 'Second Level').ok(function (res3){
		  		secondChildId = res3.body.succinctProperties['cmis:objectId'];
		  		assert(randomFolderId !== undefined,'objectId should be defined');
		  		assert(res.status === 201,'status should be 201');
		  		assert(res2.status === 201,'status should be 201');
		  		assert(res3.status === 201,'status should be 201');
		  		done();
		  	});
	  	});
  	});
  });



  it('should return object children', function (done) {
  	session.getChildren(randomFolderId).ok(function (res){
  		assert(
  			res.body.objects[0].object.succinctProperties['cmis:name']=='First Level'
  			, "Should have a child named 'First Level'");
  		done();
  	});
  });

  it('should return object descendants', function (done) {
  	session.getDescendants(randomFolderId).ok(function (res){
  		assert(
  			res.body[0].object.object.succinctProperties['cmis:name']=='First Level'
  			, "Should have a child named 'First Level'");
  		assert(
  			res.body[0].children[0].object.object.succinctProperties['cmis:name']=='Second Level'
  			, "Should have a descendant named 'First Level'");
  		done();
  	});
  });

  it('should return folder tree', function (done) {
  	session.getFolderTree(randomFolderId).ok(function (res){
  		assert(
  			res.body[0].object.object.succinctProperties['cmis:name']=='First Level'
  			, "Should have a child named 'First Level'");
  		assert(
  			res.body[0].children[0].object.object.succinctProperties['cmis:name']=='Second Level'
  			, "Should have a descendant named 'First Level'");
  		done();
  	}).notOk(function (res) {
  		assert(res.body.exception=='notSupported', "not supported");
  		console.log("Get folder tree is not supported in this repository")
  		done();
  	});
  });

  it('should return folder parent', function (done) {
  	session.getFolderParent(randomFolderId).ok(function (res){
  		assert(
  			res.body.succinctProperties['cmis:objectId']==rootId, 
  			"should return root folder");
  		done();
  	});
  });

  it('should return object parents', function (done) {
  	session.getParents(randomFolderId).ok(function (res){
  		assert(
  			res.body[0].object.succinctProperties['cmis:objectId']==rootId, 
  			"should return root folder");
  		done();
  	});
  });

  it('should return allowable actions', function (done) {
  	session.getAllowableActions(randomFolderId).ok(function (res){
  		assert(
  			res.body.canCreateDocument!==undefined, 
  			"create document action should be defined");
  		done();
  	});
  });

  it('should return object properties', function (done) {
  	session.getProperties(randomFolderId).ok(function (res){
  		assert(
  			res.body['cmis:name']==randomFolder, 
  			"folder name should be " + randomFolder);
  		done();
  	});
  });

  it('should update object properties', function (done) {
    session.updateProperties(firstChildId,
      {'cmis:name':'First Level Renamed'}).ok(function (res){
      assert(
        res.body.succinctProperties['cmis:name']=='First Level Renamed', 
        "folder name should be 'First Level Renamed'");
      done();
    });
  });  

  it('should move specified object', function (done) {
    session.moveObject(secondChildId, firstChildId, randomFolderId).ok(function (res){
      assert(res.body.succinctProperties['cmis:parentId']==randomFolderId,
         "Parent folder id should be " + randomFolderId);
      done();
    });
  });  

  var docId
  var txt = 'this is the document content';
  it('should create a document', function (done) {
    var aces = {}
    aces[username] = ['cmis:read'];
    session.createDocument(randomFolderId, 'test.txt', 
        txt, 'text/plain', undefined, undefined, aces).ok(function (res){
      docId = res.body.succinctProperties['cmis:objectId'];
      assert(res.status === 201,'status should be 201');
      done();
    });
  });

  it('should update properties of documents', function (done) {
    session.bulkUpdateProperties([docId], 
      {'cmis:name':'mod-test.txt'}).ok(function (res){
      assert(res.ok,'OK');
      done();
    }).notOk(function (res) {
      assert(res.body.exception=='notSupported', "not supported");
      console.log("bulk update is not supported in this repository")
      done();
    });
  });

  it('should get document content', function (done) {
    session.getContentStream(docId).ok(function (res){
      assert(res.text == txt,'document content should be "' + txt + '"');
      done();
    });
  });

  it('should get document content URL', function (done) {
    assert(session.getContentStreamURL(docId).indexOf("content")!=-1, "URL should be well formed");
    done();
  });

  it('should get renditions', function (done) {
    session.getRenditions(docId).ok(function (res){
      assert(Array.isArray(res.body),'status should be 200');
      done();
    });
  });

  var checkOutId;
  it('should check out a document', function (done) {
    session.checkOut(docId).ok(function (res){
      checkOutId = res.body.succinctProperties['cmis:objectId'];
      assert(checkOutId && checkOutId!=docId, "checked out id should be different from document id")
      done();
    }).notOk(function (res) {
      assert(res.body.exception=='notSupported', "not supported");
      console.log("checkout is not supported in this repository")
      done();
    });
  });

  it('should cancel a check out ', function (done) {
    if (!checkOutId){
      console.log("skipping")
      done();
      return;
    }
    session.cancelCheckOut(checkOutId).ok(function (res){
      assert(res.ok, "OK")
      done();
    });
  });

  it('should check out a document (again)', function (done) {
    if (!checkOutId){
      console.log("skipping")
      done();
      return;
    }
    session.checkOut(docId).ok(function (res){
      checkOutId = res.body.succinctProperties['cmis:objectId'];
      assert(checkOutId && checkOutId!=docId, "checked out id should be different from document id")
      done();
    });
  });

  it('should check in a document', function (done) {
    if (!checkOutId){
      console.log("skipping")
      done();
      return;
    }
    session.checkIn(checkOutId, true, 'test-checkedin.txt', 
        txt, 'the comment!').ok(function (res){
      docId = res.body.succinctProperties['cmis:objectId'].split(";")[0];
      assert(res.status === 201,'status should be 201');
      done();
    });
  });


  it('should update document content', function (done) {
    txt = 'updated content';
    session.setContentStream(docId, txt, true, 'text/plain').ok(function (res){
      assert(res.ok,'OK');
      done();
    });
  });

  var appended = " - appended";
  var changeToken;
  it('should append content to document', function (done) {
    session.appendContentStream(docId, appended, true).ok(function (res){
      changeToken = res.body.succinctProperties['cmis:changeToken'];
      assert(res.ok,'OK');
      done();
    }).notOk(function (res) {
      appended = false;
      assert(res.body.exception=='notSupported', "not supported");
      console.log("append is not supported in this repository")
      done();
    });
  });

  it('should get document appended content', function (done) {
    if (!appended){
      console.log("skipping")
      done();
      return; 
    }
    session.getContentStream(docId).ok(function (res){
      assert(res.text == txt+appended,'document content should be "' + txt + appended + '"');
      done();
    });
  });

  it('should delete object content', function (done) {
    session.deleteContentStream(docId, {changeToken:changeToken}).ok(function (res){
      assert(res.status === 200,'status should be 200');
      done();
    });
  });

  it('should get object versions', function (done) {
    session.getAllVersions(docId).ok(function (res){
      assert(res.body[0].succinctProperties['cmis:versionLabel'] !==undefined ,'version label should be defined');
      done();
    }).notOk(function (res) {
      assert(res.body.exception=='invalidArgument', "invalid argument");
      console.log("Spedified document is not versioned")
      done();
    });
  });

  it('should get object relationships', function (done) {
    session.getObjectRelationships(docId).ok(function (res){
      assert(res.status === 200,'status should be 200');
      done();
    });
  });

  it('should get object policies', function (done) {
    session.getAppliedPolicies(docId).ok(function (res){
      assert(res.status === 200,'status should be 200');
      done();
    });
  });

  it('should get object ACL', function (done) {
    session.getACL(docId).ok(function (res){
      assert(res.body.aces  !== undefined,'aces should be defined');
      done();
    });
  });

  it('should delete a folder', function (done) {
    session.deleteObject(secondChildId, true).ok(function (res){
      assert(res.status === 200,'status should be 200');
      done();
    });
  });

  it('should delete a folder tree', function (done) {
   	session.deleteTree(randomFolderId, true, undefined, true).ok(function (res){
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
