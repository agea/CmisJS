var cmis = require('../lib/cmis');
var fs = require('fs');

var url = "http://cmis.alfresco.com/cmisbrowser";
var username = "admin";
var password = "admin";
var filename = 'ok.png';
var mimetype = 'png';


if (process.argv.indexOf('--url') !== -1) {
  url = process.argv[process.argv.indexOf('--url') + 1];
}

if (process.argv.indexOf('--username') !== -1) {
  username = process.argv[process.argv.indexOf('--username') + 1];
}

if (process.argv.indexOf('--password') !== -1) {
  password = process.argv[process.argv.indexOf('--password') + 1];
}

if (process.argv.indexOf('--filename') !== -1) {
  filename = process.argv[process.argv.indexOf('--filename') + 1];
}

if (process.argv.indexOf('--filename') !== -1) {
  mimetype = process.argv[process.argv.indexOf('--mimetype') + 1];
}


var session = cmis.createSession(url);

session
  .setCredentials(username, password)
  .loadRepositories()
  .ok(function() {
    session.getObjectByPath('/')
      .ok(function(data) {
        var rootId = data.succinctProperties['cmis:objectId'];
        fs.readFile(filename, function(err, data) {
          session.createDocument(rootId, data, filename, mimetype)
            .ok(function(data) {
              console.log(data);
            });
        });
      });
  });
