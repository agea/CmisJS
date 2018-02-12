"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cmis_1 = require("./cmis");
var chai_1 = require("chai");
require("mocha");
var username = 'admin';
var password = 'admin';
var url = 'https://cmis.alfresco.com/cmisbrowser';
if (undefined !== process && undefined != process.env) {
    url = process.env.CMIS_URL || url;
    username = process.env.CMIS_USERNAME || username;
    password = process.env.CMIS_PASSWORD || password;
}
else if (undefined !== window) {
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
var session = new cmis_1.cmis.CmisSession(url);
session.setCredentials(username, password);
describe('CmisJS library test', function () {
    this.timeout(10000);
    it('should connect to a repository', function (done) {
        session.loadRepositories().then(function () {
            chai_1.assert(parseFloat(session.defaultRepository.cmisVersionSupported) >= .99, "CMIS Version should be at least 1.0");
            console.log(session.defaultRepository.rootFolderUrl);
            done();
        }).catch(function (err) { return done(err); });
    });
    it('should get repository informations', function (done) {
        session.getRepositoryInfo().then(function (data) {
            var id = session.defaultRepository.repositoryId;
            chai_1.assert(id == data[id].repositoryId, "id should be the same");
            done();
        });
    });
    it('should get type children definitions', function (done) {
        session.getTypeChildren().then(function (data) {
            chai_1.assert(data.numItems > 0, "Some types should be defined");
            done();
        });
    });
    it('should get type descendants definitions', function (done) {
        session.getTypeDescendants(null, 5).then(function (data) {
            chai_1.assert(data, "Response should be ok");
            done();
        });
    });
    it('should get type definition', function (done) {
        session.getTypeDefinition('cmis:document')
            .then(function (data) {
            chai_1.assert(data.propertyDefinitions['cmis:name'] !== undefined, "cmis:document should have cmis:name property");
            done();
        });
    });
    it('should get checked out documents', function (done) {
        session.getCheckedOutDocs()
            .then(function (data) {
            chai_1.assert(data.objects !== undefined, "objects should be defined");
            done();
        });
    });
    it('should query the repository', function (done) {
        session.query("select * from cmis:document", false, {
            maxItems: 3
        })
            .then(function (data) {
            chai_1.assert(data.results.length == 3, 'Should find 3 documents');
            done();
        }).catch(function (err) {
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
    };
    it('should create a new type', function (done) {
        session.createType(testType).then(function (data) {
            chai_1.assert(data, "Response should be ok");
            done();
        }).catch(function (err) {
            if (err.response) {
                err.response.json().then(function (json) {
                    chai_1.assert(json.exception == 'notSupported', "not supported");
                    console.warn("Type creation is not supported in this repository");
                    done();
                });
            }
            else {
                done(err);
            }
        });
    });
    it('should update a type', function (done) {
        session.updateType(testType).then(function (data) {
            chai_1.assert(data, "Response should be ok");
            done();
        }).catch(function (err) {
            if (err.response) {
                err.response.json().then(function (json) {
                    chai_1.assert(json.exception == 'notSupported', "not supported");
                    console.warn("Type creation is not supported in this repository");
                    done();
                });
            }
            else {
                done(err);
            }
        });
    });
    it('should delete a type', function (done) {
        session.deleteType(testType.id).then(function (data) {
            chai_1.assert(data, "Response should be ok");
            done();
        }).catch(function (err) {
            if (err.response) {
                err.response.json().then(function (json) {
                    chai_1.assert(json.exception == 'notSupported', "not supported");
                    console.warn("Type creation is not supported in this repository");
                    done();
                });
            }
            else {
                done(err);
            }
        });
    });
    var rootId;
    it('should retrieve an object by path', function (done) {
        session.getObjectByPath('/').then(function (data) {
            rootId = data.succinctProperties['cmis:objectId'];
            chai_1.assert(data.succinctProperties['cmis:name'] !== undefined, 'name should be defined');
            done();
        });
    });
    it('should retrieve an object by id', function (done) {
        session.getObject(rootId).then(function (data) {
            rootId = data.succinctProperties['cmis:objectId'];
            chai_1.assert(data.succinctProperties['cmis:path'] == '/', 'root object path should be /');
            done();
        });
    });
    var specialChars = ['a'];
    var randomFolder = "CmisJS" + specialChars[Math.floor(Math.random() * specialChars.length)] + Math.random();
    it('should non found this path', function (done) {
        session.getObjectByPath("/" + randomFolder).catch(function (err) {
            var httpError = err;
            chai_1.assert(httpError.response.status == 404, 'object should not exist');
            done();
        });
    });
    var randomFolderId;
    var firstChildId;
    var secondChildId;
    it('should create some folders', function (done) {
        session.createFolder(rootId, randomFolder).then(function (data) {
            randomFolderId = data.succinctProperties['cmis:objectId'];
            session.createFolder(randomFolderId, 'First Level').then(function (data2) {
                firstChildId = data2.succinctProperties['cmis:objectId'];
                session.createFolder(firstChildId, 'Second Level').then(function (data3) {
                    secondChildId = data3.succinctProperties['cmis:objectId'];
                    chai_1.assert(secondChildId !== undefined, 'objectId should be defined');
                    done();
                });
            });
        });
    });
    it('should return object children', function (done) {
        session.getChildren(randomFolderId).then(function (data) {
            chai_1.assert(data.objects[0].object.succinctProperties['cmis:name'] == 'First Level', "Should have a child named 'First Level'");
            done();
        });
    });
    it('should return object descendants', function (done) {
        session.getDescendants(randomFolderId).then(function (data) {
            chai_1.assert(data[0].object.object.succinctProperties['cmis:name'] == 'First Level', "Should have a child named 'First Level'");
            chai_1.assert(data[0].children[0].object.object.succinctProperties['cmis:name'] == 'Second Level', "Should have a descendant named 'First Level'");
            done();
        });
    });
    it('should return folder tree', function (done) {
        session.getFolderTree(randomFolderId).then(function (data) {
            chai_1.assert(data[0].object.object.succinctProperties['cmis:name'] == 'First Level', "Should have a child named 'First Level'");
            chai_1.assert(data[0].children[0].object.object.succinctProperties['cmis:name'] == 'Second Level', "Should have a descendant named 'First Level'");
            done();
        }).catch(function (err) {
            if (err.response) {
                err.response.json().then(function (json) {
                    chai_1.assert(json.exception == 'notSupported', "not supported");
                    console.log("Get folder tree is not supported in this repository");
                    done();
                });
            }
            else {
                done(err);
            }
        });
    });
    it('should return folder parent', function (done) {
        session.getFolderParent(randomFolderId).then(function (data) {
            chai_1.assert(data.succinctProperties['cmis:objectId'] == rootId, "should return root folder");
            done();
        });
    });
    it('should return object parents', function (done) {
        session.getParents(randomFolderId).then(function (data) {
            chai_1.assert(data[0].object.succinctProperties['cmis:objectId'] == rootId, "should return root folder");
            done();
        });
    });
    it('should return allowable actions', function (done) {
        session.getAllowableActions(randomFolderId).then(function (data) {
            chai_1.assert(data.canCreateDocument !== undefined, "create document action should be defined");
            done();
        });
    });
    it('should return object properties', function (done) {
        session.getProperties(randomFolderId).then(function (data) {
            chai_1.assert(data['cmis:name'] == randomFolder, "folder name should be " + randomFolder);
            done();
        });
    });
    it('should update object properties', function (done) {
        session.updateProperties(firstChildId, {
            'cmis:name': 'First Level Renamed'
        }).then(function (data) {
            chai_1.assert(data.succinctProperties['cmis:name'] == 'First Level Renamed', "folder name should be 'First Level Renamed'");
            done();
        });
    });
    it('should move specified object', function (done) {
        session.moveObject(secondChildId, firstChildId, randomFolderId).then(function (data) {
            chai_1.assert(data.succinctProperties['cmis:parentId'] == randomFolderId, "Parent folder id should be " + randomFolderId);
            done();
        });
    });
    var docId;
    var versionSeriesId;
    var txt = 'this is the document content';
    it('should create a document', function (done) {
        var aces = {};
        aces[username] = ['cmis:read'];
        session.createDocument(randomFolderId, txt, 'test.txt', 'text/plain', undefined, undefined, aces).then(function (data) {
            docId = data.succinctProperties['cmis:objectId'];
            versionSeriesId = data.succinctProperties['cmis:versionSeriesId'];
            done();
        });
    });
    it('should update properties of documents', function (done) {
        session.bulkUpdateProperties([docId], {
            'cmis:name': 'mod-test.txt'
        }).then(function (data) {
            chai_1.assert(data, 'OK');
            done();
        }).catch(function (err) {
            if (err.response) {
                err.response.json().then(function (json) {
                    chai_1.assert(json.exception == 'notSupported', "not supported");
                    console.warn("Bulk update is not supported in this repository");
                    done();
                });
            }
            else {
                done(err);
            }
        });
    });
    it('should get document content', function (done) {
        session.getContentStream(docId).then(function (res) {
            res.text().then(function (data) {
                chai_1.assert(data == txt, 'document content should be "' + txt + '"');
                done();
            });
        });
    });
    var copyId;
    it('should create a copy of the document', function (done) {
        session.createDocumentFromSource(randomFolderId, docId, undefined, 'test-copy.txt')
            .then(function (data) {
            copyId = data.succinctProperties['cmis:objectId'];
            done();
        }).catch(function (err) {
            if (err.response) {
                err.response.json().then(function (json) {
                    chai_1.assert(json.exception == 'notSupported', "not supported");
                    console.warn("Create document from source is not supported in this repository");
                    done();
                });
            }
            else {
                done(err);
            }
        });
    });
    it('should get copied document content', function (done) {
        if (!copyId) {
            console.log("skipping");
            done();
            return;
        }
        session.getContentStream(copyId).then(function (res) {
            res.text().then(function (data) {
                chai_1.assert(data == txt, 'copied document content should be "' + txt + '"');
                done();
            });
        });
    });
    it('should get document content URL', function (done) {
        chai_1.assert(session.getContentStreamURL(docId).indexOf("content") != -1, "URL should be well formed");
        done();
    });
    it('should get renditions', function (done) {
        session.getRenditions(docId).then(function (data) {
            chai_1.assert(Array.isArray(data), 'should return an array');
            done();
        });
    });
    var checkOutId;
    it('should check out a document', function (done) {
        session.checkOut(docId).then(function (data) {
            checkOutId = data.succinctProperties['cmis:objectId'];
            chai_1.assert(checkOutId && checkOutId != docId, "checked out id should be different from document id");
            done();
        }).catch(function (err) {
            if (err.response) {
                err.response.json().then(function (json) {
                    var exc = json.exception;
                    if (exc == 'constraint') {
                        chai_1.assert(json.message.indexOf('checked out') !== -1, "checked out");
                        console.log("document already ckecked out");
                        done();
                    }
                    else {
                        chai_1.assert(exc == 'notSupported', "not supported");
                        console.log("checkout is not supported in this repository");
                        done();
                    }
                });
            }
            else {
                done(err);
            }
        });
    });
    it('should cancel a check out ', function (done) {
        if (!checkOutId) {
            console.log("skipping");
            done();
            return;
        }
        session.cancelCheckOut(checkOutId).then(function (data) { return done(); });
    });
    it('should check out a document (again)', function (done) {
        if (!checkOutId) {
            console.log("skipping");
            done();
            return;
        }
        session.checkOut(docId).then(function (data) {
            checkOutId = data.succinctProperties['cmis:objectId'];
            chai_1.assert(checkOutId && checkOutId != docId, "checked out id should be different from document id");
            done();
        });
    });
    it('should check in a document', function (done) {
        if (!checkOutId) {
            console.log("skipping");
            done();
            return;
        }
        session.checkIn(checkOutId, true, 'test-checkedin.txt', txt, 'the comment!').then(function (data) {
            docId = data.succinctProperties['cmis:objectId'].split(";")[0];
            versionSeriesId = data.succinctProperties['cmis:versionSeriesId'];
            done();
        });
    });
    it('should get latest version of a version series', function (done) {
        if (!docId || !versionSeriesId) {
            console.log("skipping");
            done();
            return;
        }
        session.getObjectOfLatestVersion(versionSeriesId)
            .then(function (data) {
            var latestVersionSeriesId = data.succinctProperties['cmis:versionSeriesId'];
            chai_1.assert(latestVersionSeriesId, 'latest document should have a version series id');
            chai_1.assert(versionSeriesId == latestVersionSeriesId, 'latest document should be in current version series');
            var latestDocId = data.succinctProperties['cmis:objectId'];
            chai_1.assert(latestDocId, 'latest document should have an object id');
            chai_1.assert(docId !== latestDocId, 'latest document should be the latest checked in document');
            done();
        });
    });
    it('should get object versions', function (done) {
        session.getAllVersions(versionSeriesId).then(function (data) {
            chai_1.assert(data[0].succinctProperties['cmis:versionLabel'] !== undefined, 'version label should be defined');
            done();
        }).catch(function (err) {
            if (err.response) {
                err.response.json().then(function (json) {
                    chai_1.assert(json.exception == 'invalidArgument', "invalid argument");
                    console.log("Specified document is not versioned");
                    done();
                });
            }
            else {
                done(err);
            }
        });
    });
    it('should update document content', function (done) {
        txt = 'updated content';
        session.setContentStream(docId, txt, true, 'update.txt').then(function (data) {
            chai_1.assert(data, 'OK');
            done();
        });
    });
    var appended = " - appended";
    var changeToken;
    it('should append content to document', function (done) {
        session.appendContentStream(docId, appended, true, 'append.txt').then(function (data) {
            changeToken = data.succinctProperties['cmis:changeToken'];
            chai_1.assert(data, 'OK');
            done();
        }).catch(function (err) {
            appended = null;
            if (err.response) {
                err.response.json().then(function (json) {
                    chai_1.assert(json.exception == 'notSupported', "not supported");
                    console.log("append is not supported in this repository");
                    done();
                });
            }
            else {
                done(err);
            }
        });
    });
    it('should get document appended content', function (done) {
        if (!appended) {
            console.log("skipping");
            done();
            return;
        }
        session.getContentStream(docId).then(function (res) {
            res.text().then(function (data) {
                chai_1.assert(data == txt + appended, 'document content should be "' + txt + appended + '"');
                done();
            });
        });
    });
    it('should delete object content', function (done) {
        session.deleteContentStream(docId, {
            changeToken: changeToken
        }).then(function (data) {
            chai_1.assert(data, 'OK');
            done();
        });
    });
    it('should get object policies', function (done) {
        session.getAppliedPolicies(docId).then(function (data) {
            chai_1.assert(data, 'OK');
            done();
        });
    });
    it('should get object ACL', function (done) {
        session.getACL(docId).then(function (data) {
            chai_1.assert(data.aces !== undefined, 'aces should be defined');
            done();
        }).catch(function (err) {
            if (err.response) {
                err.response.json().then(function (json) {
                    chai_1.assert(json.exception == 'notSupported', "not supported");
                    console.log("get ACL is not supported in this repository");
                    done();
                });
            }
            else {
                done(err);
            }
        });
    });
    it('should delete a folder', function (done) {
        session.deleteObject(secondChildId, true).then(function (data) { return done(); });
    });
    it('should delete a folder tree', function (done) {
        session.deleteTree(randomFolderId, true, undefined, true).then(function (data) { return done(); });
    });
    it('should get latest changes', function (done) {
        session.getContentChanges(session.defaultRepository.latestChangeLogToken)
            .then(function (data) {
            chai_1.assert(data.objects !== undefined, "objects should be defined");
            done();
        });
    });
});
//# sourceMappingURL=cmis.spec.js.map