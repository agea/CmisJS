import { cmis } from './cmis';
import { assert } from 'chai';
import 'mocha';

let username = 'admin';
let password = 'admin';
let url = 'https://cmis.alfresco.com/cmisbrowser';


if (undefined !== process && undefined != process.env) {

  url = process.env.CMIS_URL || url;
  username = process.env.CMIS_USERNAME || username;
  password = process.env.CMIS_PASSWORD || password;

} else if (undefined !== window) {

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

let session = new cmis.CmisSession(url);
session.setCredentials(username, password);

//session.setErrorHandler(err => console.log(err.stack));

describe('CmisJS library test', function () {

  this.timeout(10000);

  it('should connect to a repository', done => {
    session.loadRepositories().then(() => {
      assert(parseFloat(session.defaultRepository.cmisVersionSupported) >= .99, "CMIS Version should be at least 1.0");
      //session.defaultRepository.repositoryUrl = session.defaultRepository.repositoryUrl.replace('18080','8888');
      //session.defaultRepository.rootFolderUrl = session.defaultRepository.rootFolderUrl.replace('18080','8888');
      console.log(session.defaultRepository.rootFolderUrl);

      done();
    }).catch(err => done(err));
  });

  it('should get repository informations', done => {
    session.getRepositoryInfo().then(data => {
      var id = session.defaultRepository.repositoryId;
      assert(id == data[id].repositoryId, "id should be the same");
      done();
    });
  });

  it('should get type children definitions', done => {
    session.getTypeChildren().then(data => {
      assert(data.numItems > 0, "Some types should be defined");
      done();
    });
  });

  it('should get type descendants definitions', done => {
    session.getTypeDescendants(null, 5).then(data => {
      assert(data, "Response should be ok");
      done();
    });
  });

  it('should get type definition', done => {
    session.getTypeDefinition('cmis:document')
      .then(data => {
        assert(data.propertyDefinitions['cmis:name'] !== undefined,
          "cmis:document should have cmis:name property")
        done();
      });
  });

  it('should get checked out documents', done => {
    session.getCheckedOutDocs()
      .then(data => {
        assert(data.objects !== undefined, "objects should be defined");
        done();
      });
  });

  it('should query the repository', done => {
    session.query("select * from cmis:document", false, {
      maxItems: 3
    })
      .then(data => {
        assert(data.results.length == 3, 'Should find 3 documents');
        done();
      }).catch(err => {
        console.log(err);
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

  it('should create a new type', done => {
    session.createType(testType).then(data => {
      assert(data, "Response should be ok");
      done();
    }).catch(err => {
      if (err.response) {
        err.response.json().then(json => {
          assert(json.exception == 'notSupported', "not supported");
          console.warn("Type creation is not supported in this repository")
          done();
        });
      } else {
        done(err);
      }
    });
  });

  it('should update a type', done => {
    session.updateType(testType).then(data => {
      assert(data, "Response should be ok");
      done();
    }).catch(err => {
      if (err.response) {
        err.response.json().then(json => {
          assert(json.exception == 'notSupported', "not supported");
          console.warn("Type creation is not supported in this repository")
          done();
        });
      } else {
        done(err);
      }
    });
  });

  it('should delete a type', done => {
    session.deleteType(testType.id).then(data => {
      assert(data, "Response should be ok");
      done();
    }).catch(err => {
      if (err.response) {
        err.response.json().then(json => {
          assert(json.exception == 'notSupported', "not supported");
          console.warn("Type creation is not supported in this repository")
          done();
        });
      } else {
        done(err);
      }
    });
  });

  let rootId: string;

  it('should retrieve an object by path', done => {
    session.getObjectByPath('/').then(data => {
      rootId = data.succinctProperties['cmis:objectId'];
      assert(data.succinctProperties['cmis:name'] !== undefined,
        'name should be defined');
      done();
    });
  });


  it('should retrieve an object by id', done => {
    session.getObject(rootId).then(data => {
      rootId = data.succinctProperties['cmis:objectId'];
      assert(data.succinctProperties['cmis:path'] == '/',
        'root object path should be /');
      done();
    });
  });

  var specialChars = ['a'];//["č"];
  var randomFolder = "CmisJS" + specialChars[Math.floor(Math.random() * specialChars.length)] + Math.random();

  it('should non found this path', done => {
    session.getObjectByPath("/" + randomFolder).catch(err => {
      let httpError = err as cmis.HTTPError;
      assert(httpError.response.status == 404, 'object should not exist');
      done();
    });
  });

  var randomFolderId;
  var firstChildId;
  var secondChildId;
  it('should create some folders', done => {
    session.createFolder(rootId, randomFolder).then(data => {
      randomFolderId = data.succinctProperties['cmis:objectId'];
      session.createFolder(randomFolderId, 'First Level').then(data2 => {
        firstChildId = data2.succinctProperties['cmis:objectId'];
        session.createFolder(firstChildId, 'Second Level').then(data3 => {
          secondChildId = data3.succinctProperties['cmis:objectId'];
          assert(secondChildId !== undefined, 'objectId should be defined');
          done();
        });
      });
    });
  });

  it('should return object children', done => {
    session.getChildren(randomFolderId).then(data => {
      assert(
        data.objects[0].object.succinctProperties['cmis:name'] == 'First Level', "Should have a child named 'First Level'");
      done();
    });
  });

  it('should return object descendants', done => {
    session.getDescendants(randomFolderId).then(data => {
      assert(
        data[0].object.object.succinctProperties['cmis:name'] == 'First Level', "Should have a child named 'First Level'");
      assert(
        data[0].children[0].object.object.succinctProperties['cmis:name'] == 'Second Level', "Should have a descendant named 'First Level'");
      done();
    });
  });

  it('should return folder tree', done => {
    session.getFolderTree(randomFolderId).then(data => {
      assert(
        data[0].object.object.succinctProperties['cmis:name'] == 'First Level', "Should have a child named 'First Level'");
      assert(
        data[0].children[0].object.object.succinctProperties['cmis:name'] == 'Second Level', "Should have a descendant named 'First Level'");
      done();
    }).catch(err => {
      if (err.response) {
        err.response.json().then(json => {
          assert(json.exception == 'notSupported', "not supported");
          console.log("Get folder tree is not supported in this repository")
          done();
        });
      } else {
        done(err);
      }
    });
  });

  it('should return folder parent', done => {
    session.getFolderParent(randomFolderId).then(data => {
      assert(
        data.succinctProperties['cmis:objectId'] == rootId,
        "should return root folder");
      done();
    });
  });

  it('should return object parents', done => {
    session.getParents(randomFolderId).then(data => {
      assert(
        data[0].object.succinctProperties['cmis:objectId'] == rootId,
        "should return root folder");
      done();
    });
  });

  it('should return allowable actions', done => {
    session.getAllowableActions(randomFolderId).then(data => {
      assert(
        data.canCreateDocument !== undefined,
        "create document action should be defined");
      done();
    });
  });

  it('should return object properties', done => {
    session.getProperties(randomFolderId).then(data => {
      assert(
        data['cmis:name'] == randomFolder,
        "folder name should be " + randomFolder);
      done();
    });
  });

  it('should update object properties', done => {
    session.updateProperties(firstChildId, {
      'cmis:name': 'First Level Renamed'
    }).then(data => {
      assert(
        data.succinctProperties['cmis:name'] == 'First Level Renamed',
        "folder name should be 'First Level Renamed'");
      done();
    });
  });

  it('should move specified object', done => {
    session.moveObject(secondChildId, firstChildId, randomFolderId).then(data => {
      assert(data.succinctProperties['cmis:parentId'] == randomFolderId,
        "Parent folder id should be " + randomFolderId);
      done();
    });
  });

  let docId: string;
  let versionSeriesId: string;
  let txt: string = 'this is the document content';
  it('should create a document', done => {
    var aces = {}
    aces[username] = ['cmis:read'];
    session.createDocument(randomFolderId, txt, 'test.txt',
      'text/plain', undefined, undefined, aces).then(data => {
        docId = data.succinctProperties['cmis:objectId'];
        versionSeriesId = data.succinctProperties['cmis:versionSeriesId'];
        done();
      });
  });

  it('should update properties of documents', done => {
    session.bulkUpdateProperties([docId], {
      'cmis:name': 'mod-test.txt'
    }).then(data => {
      assert(data, 'OK');
      done();
    }).catch(err => {
      if (err.response) {
        err.response.json().then(json => {
          assert(json.exception == 'notSupported', "not supported");
          console.warn("Bulk update is not supported in this repository")
          done();
        });
      } else {
        done(err);
      }
    });
  });

  it('should get document content', done => {
    session.getContentStream(docId).then(res => {
      res.text().then(data => {
        assert(data == txt, 'document content should be "' + txt + '"');
        done();
      });
    });
  });

  let copyId;
  it('should create a copy of the document', done => {
    session.createDocumentFromSource(randomFolderId, docId, undefined, 'test-copy.txt')
      .then(data => {
        copyId = data.succinctProperties['cmis:objectId'];
        done();
      }).catch(err => {
        if (err.response) {
          err.response.json().then(json => {
            assert(json.exception == 'notSupported', "not supported");
            console.warn("Create document from source is not supported in this repository")
            done();
          });
        } else {
          done(err);
        }
      });
  });

  it('should get copied document content', done => {
    if (!copyId) {
      console.log("skipping")
      done();
      return;
    }
    session.getContentStream(copyId).then(res => {
      res.text().then(data => {
        assert(data == txt, 'copied document content should be "' + txt + '"');
        done();
      });
    });
  });

  it('should get document content URL', done => {
    assert(session.getContentStreamURL(docId).indexOf("content") != -1, "URL should be well formed");
    done();
  });

  it('should get renditions', done => {
    session.getRenditions(docId).then(data => {
      assert(Array.isArray(data), 'should return an array');
      done();
    });
  });

  var checkOutId;
  it('should check out a document', done => {
    session.checkOut(docId).then(data => {
      checkOutId = data.succinctProperties['cmis:objectId'];
      assert(checkOutId && checkOutId != docId, "checked out id should be different from document id")
      done();
    }).catch(err => {
      if (err.response) {
        err.response.json().then(json => {
          let exc = json.exception;
          if (exc == 'constraint') {
            assert(json.message.indexOf('checked out') !== -1, "checked out");
            console.log("document already ckecked out");
            done();
          } else {
            assert(exc == 'notSupported', "not supported");
            console.log("checkout is not supported in this repository")
            done();
          }
        });
      } else {
        done(err);
      }
    });
  });

  it('should cancel a check out ', done => {
    if (!checkOutId) {
      console.log("skipping")
      done();
      return;
    }
    session.cancelCheckOut(checkOutId).then(data => done());
  });

  it('should check out a document (again)', done => {
    if (!checkOutId) {
      console.log("skipping")
      done();
      return;
    }
    session.checkOut(docId).then(data => {
      checkOutId = data.succinctProperties['cmis:objectId'];
      assert(checkOutId && checkOutId != docId, "checked out id should be different from document id")
      done();
    });
  });

  it('should check in a document', done => {
    if (!checkOutId) {
      console.log("skipping")
      done();
      return;
    }
    session.checkIn(checkOutId, true, 'test-checkedin.txt',
      txt, 'the comment!').then(data => {
        docId = data.succinctProperties['cmis:objectId'].split(";")[0];
        versionSeriesId = data.succinctProperties['cmis:versionSeriesId'];
        done();
      });
  });

  it('should get latest version of a version series', done => {
    if (!docId || !versionSeriesId) {
      console.log("skipping")
      done();
      return;
    }
    session.getObjectOfLatestVersion(versionSeriesId)
      .then(data => {
        var latestVersionSeriesId = data.succinctProperties['cmis:versionSeriesId'];
        assert(latestVersionSeriesId, 'latest document should have a version series id');
        assert(versionSeriesId == latestVersionSeriesId, 'latest document should be in current version series');

        var latestDocId = data.succinctProperties['cmis:objectId'];
        assert(latestDocId, 'latest document should have an object id');
        assert(docId !== latestDocId, 'latest document should be the latest checked in document');

        done();
      });
  });

  it('should get object versions', done => {
    session.getAllVersions(versionSeriesId).then(data => {
      assert(data[0].succinctProperties['cmis:versionLabel'] !== undefined, 'version label should be defined');
      done();
    }).catch(err => {
      if (err.response) {
        err.response.json().then(json => {
          assert(json.exception == 'invalidArgument', "invalid argument");
          console.log("Specified document is not versioned")
          done();
        });
      } else {
        done(err);
      }
    });
  });

  it('should update document content', done => {
    txt = 'updated content';
    session.setContentStream(docId, txt, true, 'update.txt').then(data => {
      assert(data, 'OK');
      done();
    });
  });

  let appended = " - appended";
  let changeToken;
  it('should append content to document', done => {
    session.appendContentStream(docId, appended, true, 'append.txt').then(data => {
      changeToken = data.succinctProperties['cmis:changeToken'];
      assert(data, 'OK');
      done();
    }).catch(err => {
      appended = null;
      if (err.response) {
        err.response.json().then(json => {
          assert(json.exception == 'notSupported', "not supported");
          console.log("append is not supported in this repository")
          done();
        });
      } else {
        done(err);
      }
    });
  });

  it('should get document appended content', done => {
    if (!appended) {
      console.log("skipping")
      done();
      return;
    }
    session.getContentStream(docId).then(res => {
      res.text().then(data => {
        assert(data == txt + appended, 'document content should be "' + txt + appended + '"');
        done();
      });
    });
  });

  it('should delete object content', done => {
    session.deleteContentStream(docId, {
      changeToken: changeToken
    }).then(data => {
      assert(data, 'OK');
      done();
    });
  });

  it('should get object policies', done => {
    session.getAppliedPolicies(docId).then(data => {
      assert(data, 'OK');
      done();
    });
  });

  it('should get object ACL', done => {
    session.getACL(docId).then(data => {
      assert(data.aces !== undefined, 'aces should be defined');
      done();
    }).catch(err => {
      if (err.response) {
        err.response.json().then(json => {
          assert(json.exception == 'notSupported', "not supported");
          console.log("get ACL is not supported in this repository")
          done();
        });
      } else {
        done(err);
      }
    });
  });

  it('should delete a folder', done => {
    session.deleteObject(secondChildId, true).then(data => done());
  });

  it('should delete a folder tree', done => {
    session.deleteTree(randomFolderId, true, undefined, true).then(data => done());
  });

  it('should get latest changes', done => {
    session.getContentChanges(session.defaultRepository.latestChangeLogToken)
      .then(data => {
        assert(data.objects !== undefined, "objects should be defined");
        done();
      });
  });

});
