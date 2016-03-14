var cmis = require('../lib/cmis');
var fs = require('fs');

var url = "http://cmis.alfresco.com/cmisbrowser";
var username = "admin";
var password = "admin";


if (process.argv.indexOf('--url') !== -1) {
  url = process.argv[process.argv.indexOf('--url') + 1];
}

if (process.argv.indexOf('--username') !== -1) {
  username = process.argv[process.argv.indexOf('--username') + 1];
}

if (process.argv.indexOf('--password') !== -1) {
  password = process.argv[process.argv.indexOf('--password') + 1];
}

var session = cmis.createSession(url);

session
  .setCredentials(username, password)
  .loadRepositories()
  .ok(function () {
    session.getObjectByPath('/')
      .ok(function (data) {
        var rootId = data.succinctProperties['cmis:objectId'];
        var filename = 'ok.png';
        fs.readFile(filename, function (err, data) {
          session.createDocument(rootId, data, filename)
            .ok(function (data) {
              console.log(data);
            });
        });
      });
  });
