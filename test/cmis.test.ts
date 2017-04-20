import { cmis } from '../src/cmis';
import { assert } from 'chai';
import 'mocha';

let username = 'admin';
let password = 'admin';
let session = new cmis.CmisSession('http://localhost:18080/alfresco/cmisbrowser');
session.setCredentials(username, password);

session.setErrorHandler((err) => console.log(err));

describe('CmisJS library test', () => {

  it('should connect to a repository', (done) => {
    session.loadRepositories().then(() => {
      assert(parseFloat(session.defaultRepository.cmisVersionSupported) >= .99, "CMIS Version should be at least 1.0");
      done();
    }).catch(err => done(err));
  });

  it('should get repository informations', (done) => {
    session.getRepositoryInfo().then(data => {
      var id = session.defaultRepository.repositoryId;
      assert(id == data[id].repositoryId, "id should be the same");
      done();
    });
  });

  it('should get type children definitions', function (done) {
    session.getTypeChildren().then(data => {
      assert(data.numItems > 0, "Some types should be defined");
      done();
    });
  });

  it('should get type descendants definitions', function (done) {
    session.getTypeDescendants(null, 5).then(data => {
      debugger;
      assert(data, "Response should be ok");
      done();
    });
  });



});
