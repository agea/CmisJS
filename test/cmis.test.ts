import { cmis } from '../src/cmis';
import { assert } from 'chai';
import 'mocha';

let username = 'admin';
let password = 'admin';
let session = new cmis.CmisSession('http://localhost:18080/alfresco/cmisbrowser');
session.setCredentials(username, password);

//session.setErrorHandler((err) => console.log(err));


describe('CmisJS library test', function() {
  
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

  it('should get type descendants definitions',  done => {
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

  let rootId:string;

  it('should retrieve an object by path', done => {
    session.getObjectByPath('/').then( data => {
      rootId = data.succinctProperties['cmis:objectId'];
      assert(data.succinctProperties['cmis:name'] !== undefined,
        'name should be defined');
      done();
    });
  });

});
