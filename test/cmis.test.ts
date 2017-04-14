import { cmis } from '../src/cmis';
import { assert } from 'chai';
import 'mocha';

let username = 'admin';
let password = 'admin';
let session = new cmis.CmisSession('http://localhost:18080/alfresco/cmisbrowser');
session.setCredentials(username, password);

describe('testing...', () => {
  it('should connect to a repository', (done) => {
     session.loadRepositories().then(res => {
       assert(parseFloat(session.defaultRepository.cmisVersionSupported) >= .99,"CMIS Version should be at least 1.0");
       done();
    }).catch(err=>done(err));
  });
});
