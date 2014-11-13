'use strict';

var url = url || "http://cmis.alfresco.com/cmisbrowser";
var username = "admin";
var password = "admin";

var isNode = typeof module !== 'undefined' && module.exports;

if (isNode) {

  var Stream = require('stream');

  var assert = require('assert'),
    cmis = require('../lib/cmis');

  if (process.argv.indexOf('--url') !== -1) {
    url = process.argv[process.argv.indexOf('--url') + 1];
  }

  if (process.argv.indexOf('--username') !== -1) {
    username = process.argv[process.argv.indexOf('--username') + 1];
  }

  if (process.argv.indexOf('--password') !== -1) {
    password = process.argv[process.argv.indexOf('--password') + 1];
  }
} else {

  var q = window.location.search.substring(1).split('&');

  for (var i = 0; i < q.length; i++) {

    var p = q[i].split("=");

    if (p[0] == 'username') {
      username = p[1];
    }
    if (p[0] == 'password') {
      password = p[1];
    }
  }
}

var session = cmis.createSession(url);

session.setGlobalHandlers(console.log, console.log);

var rootId;

describe('CmisJS library test', function () {

  this.timeout(10000);

  it('should connect to a repository', function (done) {
    session.setCredentials(username, password).loadRepositories()
      .ok(function (data) {
        assert(parseFloat(session.defaultRepository.cmisVersionSupported) >= .99,
          "CMIS Version should be at least 1.0");
        if (!isNode) {
          session.defaultRepository.repositoryUrl = session.defaultRepository.repositoryUrl.substring(session.defaultRepository.repositoryUrl.indexOf('/cmisbrowser'));
          session.defaultRepository.rootFolderUrl = session.defaultRepository.rootFolderUrl.substring(session.defaultRepository.rootFolderUrl.indexOf('/cmisbrowser'));
        }
        done();
      });
  });

  it('should get repository informations', function (done) {
    session.getRepositoryInfo()
      .ok(function (data) {
        var id = session.defaultRepository.repositoryId;
        assert(id == data[id].repositoryId, "id should be the same");
        done();
      });
  });

  it('should get type children definitions', function (done) {
    session.getTypeChildren()
      .ok(function (data) {
        assert(data.numItems > 0, "Some types should be defined");
        done();
      });
  });

  it('should get type descendants definitions', function (done) {
    session.getTypeDescendants(null, 5)
      .ok(function (data) {
        assert(data, "Response should be ok");
        done();
      });
  });

  it('should get type definition', function (done) {
    session.getTypeDefinition('cmis:document')
      .ok(function (data) {
        assert(data.propertyDefinitions['cmis:name'] !== undefined,
          "cmis:document should have cmis:name property")
        done();
      });
  });

  it('should get checked out documents', function (done) {
    session.getCheckedOutDocs()
      .ok(function (data) {
        assert(data.objects !== undefined, "objects should be defined");
        done();
      });
  });

  it('should query the repository', function (done) {
    session.query("select * from cmis:document", false, {
      maxItems: 3
    })
      .ok(function (data) {
        assert(data.results.length == 3, 'Should find 3 documents');
        done();
      });
  });

  var testType = {
    id: 'test:testDoc',
    baseId: 'cmis:document',
    parentId: 'cmis:document',
    displayName: 'Test Document',
    description: 'Test Document Type',
    localNamespace: 'local',
    localName: 'test:testDoc',
    queryName: 'test:testDoc',
    fileable: true,
    includedInSupertypeQuery: true,
    creatable: true,
    fulltextIndexed: false,
    queryable: false,
    controllableACL: true,
    controllablePolicy: false,
    propertyDefinitions: {
      'test:aString': {
        id: 'test:aString',
        localNamespace: 'local',
        localName: 'test:aString',
        queryName: 'test:aString',
        displayName: 'A String',
        description: 'This is a String.',
        propertyType: 'string',
        updatability: 'readwrite',
        inherited: false,
        openChoice: false,
        required: false,
        cardinality: 'single',
        queryable: true,
        orderable: true,
      }
    }
  }

  it('should create a new type', function (done) {
    session.createType(testType).ok(function (data) {
      assert(data, "Response should be ok");
      done();
    }).notOk(function (res) {
      assert(res.body.exception == 'notSupported', "not supported");
      console.log("Type creation is not supported in this repository")
      done();
    });
  });

  it('should update a type', function (done) {
    testType.displayName = 'A Modified test document';
    session.updateType(testType).ok(function (data) {
      assert(data, "Response should be ok");
      done();
    }).notOk(function (res) {
      assert(res.body.exception == 'notSupported', "not supported");
      console.log("Type update is not supported in this repository")
      done();
    });
  });

  it('should delete a type', function (done) {
    session.deleteType(testType.id).ok(function (data) {
      assert(data, "Response should be ok");
      done();
    }).notOk(function (res) {
      assert(res.body.exception == 'notSupported', "not supported");
      console.log("Type deletion is not supported in this repository")
      done();
    });
  });


  it('should retrieve an object by path', function (done) {
    session.getObjectByPath('/').ok(function (data) {
      rootId = data.succinctProperties['cmis:objectId'];
      assert(data.succinctProperties['cmis:name'] !== undefined,
        'name should be defined');
      done();
    });
  });

  it('should retrieve an object by id', function (done) {
    session.getObject(rootId).ok(function (data) {
      rootId = data.succinctProperties['cmis:objectId'];
      assert(data.succinctProperties['cmis:path'] == '/',
        'root object path should be /');
      done();
    });
  });

  var randomFolder = "CmisJS" + Math.random();

  it('should non found this path', function (done) {
    session.getObjectByPath("/" + randomFolder).notOk(function (res) {
      assert(res.notFound, 'object should not exist');
      done();
    });
  });

  var randomFolderId;
  var firstChildId;
  var secondChildId;
  it('should create some folders', function (done) {
    session.createFolder(rootId, randomFolder).ok(function (data) {
      randomFolderId = data.succinctProperties['cmis:objectId'];
      session.createFolder(randomFolderId, 'First Level').ok(function (data2) {
        firstChildId = data2.succinctProperties['cmis:objectId'];
        session.createFolder(firstChildId, 'Second Level').ok(function (data3) {
          secondChildId = data3.succinctProperties['cmis:objectId'];
          assert(secondChildId !== undefined, 'objectId should be defined');
          done();
        });
      });
    });
  });

  it('should return object children', function (done) {
    session.getChildren(randomFolderId).ok(function (data) {
      assert(
        data.objects[0].object.succinctProperties['cmis:name'] == 'First Level', "Should have a child named 'First Level'");
      done();
    });
  });

  it('should return object descendants', function (done) {
    session.getDescendants(randomFolderId).ok(function (data) {
      assert(
        data[0].object.object.succinctProperties['cmis:name'] == 'First Level', "Should have a child named 'First Level'");
      assert(
        data[0].children[0].object.object.succinctProperties['cmis:name'] == 'Second Level', "Should have a descendant named 'First Level'");
      done();
    });
  });

  it('should return folder tree', function (done) {
    session.getFolderTree(randomFolderId).ok(function (data) {
      assert(
        data[0].object.object.succinctProperties['cmis:name'] == 'First Level', "Should have a child named 'First Level'");
      assert(
        data[0].children[0].object.object.succinctProperties['cmis:name'] == 'Second Level', "Should have a descendant named 'First Level'");
      done();
    }).notOk(function (res) {
      assert(res.body.exception == 'notSupported', "not supported");
      console.log("Get folder tree is not supported in this repository")
      done();
    });
  });

  it('should return folder parent', function (done) {
    session.getFolderParent(randomFolderId).ok(function (data) {
      assert(
        data.succinctProperties['cmis:objectId'] == rootId,
        "should return root folder");
      done();
    });
  });

  it('should return object parents', function (done) {
    session.getParents(randomFolderId).ok(function (data) {
      assert(
        data[0].object.succinctProperties['cmis:objectId'] == rootId,
        "should return root folder");
      done();
    });
  });

  it('should return allowable actions', function (done) {
    session.getAllowableActions(randomFolderId).ok(function (data) {
      assert(
        data.canCreateDocument !== undefined,
        "create document action should be defined");
      done();
    });
  });

  it('should return object properties', function (done) {
    session.getProperties(randomFolderId).ok(function (data) {
      assert(
        data['cmis:name'] == randomFolder,
        "folder name should be " + randomFolder);
      done();
    });
  });

  it('should update object properties', function (done) {
    session.updateProperties(firstChildId, {
      'cmis:name': 'First Level Renamed'
    }).ok(function (data) {
      assert(
        data.succinctProperties['cmis:name'] == 'First Level Renamed',
        "folder name should be 'First Level Renamed'");
      done();
    });
  });

  it('should move specified object', function (done) {
    session.moveObject(secondChildId, firstChildId, randomFolderId).ok(function (data) {
      assert(data.succinctProperties['cmis:parentId'] == randomFolderId,
        "Parent folder id should be " + randomFolderId);
      done();
    });
  });

  var docId
  var txt = 'this is the document content';
  it('should create a document', function (done) {
    var aces = {}
    aces[username] = ['cmis:read'];
    session.createDocument(randomFolderId, txt, 'test.txt',
      'text/plain', undefined, undefined, aces).ok(function (data) {
      docId = data.succinctProperties['cmis:objectId'];
      done();
    });
  });

  it('should update properties of documents', function (done) {
    session.bulkUpdateProperties([docId], {
      'cmis:name': 'mod-test.txt'
    }).ok(function (data) {
      assert(data, 'OK');
      done();
    }).notOk(function (res) {
      assert(res.body.exception == 'notSupported', "not supported");
      console.log("bulk update is not supported in this repository")
      done();
    });
  });

  it('should get document content', function (done) {
    session.getContentStream(docId).ok(function (data) {
      assert(data == txt, 'document content should be "' + txt + '"');
      done();
    });
  });

  it('should get document content URL', function (done) {
    assert(session.getContentStreamURL(docId).indexOf("content") != -1, "URL should be well formed");
    done();
  });

  it('should get renditions', function (done) {
    session.getRenditions(docId).ok(function (data) {
      assert(Array.isArray(data), 'should return an array');
      done();
    });
  });

  var checkOutId;
  it('should check out a document', function (done) {
    session.checkOut(docId).ok(function (data) {
      checkOutId = data.succinctProperties['cmis:objectId'];
      assert(checkOutId && checkOutId != docId, "checked out id should be different from document id")
      done();
    }).notOk(function (res) {
      var exc = res.body.exception;
      if (exc == 'constraint') {
        assert(res.body.message.indexOf('checked out')!==-1, "checked out");
        console.log("document already ckecked out");
        done();
      } else {
        assert(exc == 'notSupported', "not supported");
        console.log("checkout is not supported in this repository")
        done();
      }
    });
  });

  it('should cancel a check out ', function (done) {
    if (!checkOutId) {
      console.log("skipping")
      done();
      return;
    }
    session.cancelCheckOut(checkOutId).ok(function (data) {
      done();
    });
  });

  it('should check out a document (again)', function (done) {
    if (!checkOutId) {
      console.log("skipping")
      done();
      return;
    }
    session.checkOut(docId).ok(function (data) {
      checkOutId = data.succinctProperties['cmis:objectId'];
      assert(checkOutId && checkOutId != docId, "checked out id should be different from document id")
      done();
    });
  });

  it('should check in a document', function (done) {
    if (!checkOutId) {
      console.log("skipping")
      done();
      return;
    }
    session.checkIn(checkOutId, true, 'test-checkedin.txt',
      txt, 'the comment!').ok(function (data) {
      docId = data.succinctProperties['cmis:objectId'].split(";")[0];
      done();
    });
  });


  it('should update document content', function (done) {
    txt = 'updated content';
    session.setContentStream(docId, txt, true, 'text/plain').ok(function (data) {
      assert(data, 'OK');
      done();
    });
  });

  var appended = " - appended";
  var changeToken;
  it('should append content to document', function (done) {
    session.appendContentStream(docId, appended, true).ok(function (data) {
      changeToken = data.succinctProperties['cmis:changeToken'];
      assert(data, 'OK');
      done();
    }).notOk(function (res) {
      appended = false;
      assert(res.body.exception == 'notSupported', "not supported");
      console.log("append is not supported in this repository")
      done();
    });
  });

  it('should get document appended content', function (done) {
    if (!appended) {
      console.log("skipping")
      done();
      return;
    }
    session.getContentStream(docId).ok(function (data) {
      assert(data == txt + appended, 'document content should be "' + txt + appended + '"');
      done();
    });
  });

  it('should delete object content', function (done) {
    session.deleteContentStream(docId, {
      changeToken: changeToken
    }).ok(function (data) {
      assert(data, 'OK');
      done();
    });
  });

  it('should get object versions', function (done) {
    session.getAllVersions(docId).ok(function (data) {
      assert(data[0].succinctProperties['cmis:versionLabel'] !== undefined, 'version label should be defined');
      done();
    }).notOk(function (res) {
      assert(res.body.exception == 'invalidArgument', "invalid argument");
      console.log("Spedified document is not versioned")
      done();
    });
  });

  it('should get object relationships', function (done) {
    session.getObjectRelationships(docId).ok(function (data) {
      assert(data, 'OK');
      done();
    });
  });

  it('should get object policies', function (done) {
    session.getAppliedPolicies(docId).ok(function (data) {
      assert(data, 'OK');
      done();
    });
  });

  it('should get object ACL', function (done) {
    session.getACL(docId).ok(function (data) {
      assert(data.aces !== undefined, 'aces should be defined');
      done();
    }).notOk(function (res) {
      assert(res.body.exception == 'notSupported', "not supported");
      console.log("get ACL is not supported in this repository")
      done();
    });
  });

  it('should delete a folder', function (done) {
    session.deleteObject(secondChildId, true).ok(function (data) {
      done();
    });
  });

  it('should delete a folder tree', function (done) {
    session.deleteTree(randomFolderId, true, undefined, true).ok(function (data) {
      done();
    });
  });

  it('should get latest changes', function (done) {
    session.getContentChanges(session.defaultRepository.latestChangeLogToken)
      .ok(function (data) {
        assert(data.objects !== undefined, "objects should be defined");
        done();
      });
  });


})