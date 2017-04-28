import { cmis } from '../src/cmis';
import { assert } from 'chai';
import 'mocha';

let username = 'admin';
let password = 'admin';
let session = new cmis.CmisSession('http://localhost:18080/alfresco/cmisbrowser');
session.setCredentials(username, password);

//session.setErrorHandler((err) => console.log(err));


describe('CmisJS library test', function () {

  this.timeout(10000);

  it('should connect to a repository', done => {
    session.loadRepositories().then(() => {
      assert(parseFloat(session.defaultRepository.cmisVersionSupported) >= .99, "CMIS Version should be at least 1.0");
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

  var specialChars = ["č"];
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

 it('should return object properties',  done => {
    session.getProperties(randomFolderId).then(data => {
      assert(
        data['cmis:name'] == randomFolder,
        "folder name should be " + randomFolder);
      done();
    });
  });

it('should update object properties',  done => {
    session.updateProperties(firstChildId, {
      'cmis:name': 'First Level Renamed'
    }).then(data => {
      assert(
        data.succinctProperties['cmis:name'] == 'First Level Renamed',
        "folder name should be 'First Level Renamed'");
      done();
    });
  });


});
