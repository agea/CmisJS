//  CmisJS 
//  http://github.com/agea/CmisJS
//  (c) 2013 Andrea Agili
//  CmisJS may be freely distributed under the Apache 2.0 license.

(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else {
        root.cmis = factory();
    }
}(this, function () {
    'use strict';

    /**
    * @class cmis
    * global object
    *
    *      var session = cmis.createSession(url);
    *
    */

    var lib = {};

    /**
    * @method createSession
    * @return {CmisSession}
    *
    */

    lib.createSession = function(url){

        /**
        * @class CmisSession
        *
        * the session is the enrty point for all cmis requests
        * before making any request, session.loadRepository() must be invoked
        *
        */
        var session = {};

        /**
        * sets token for authentication 
        *
        * @param {String} token
        * @return {CmisSession}
        */
        session.setToken = function (token) {
            _defaultOptions.token = token;
            return session;
        }

        /**
        * sets credentials for authentication 
        * @method setCredentials
        * @param {String} username
        * @param {String} password
        * @return {CmisSession}
        */
        session.setCredentials = function (username, password) {
            _username = username;
            _password = password;
            return session;
        }

        /**
        * sets global handlers for non ok and error responses
        * @method setGlobalHandlers
        * @param {Function} notOk
        * @param {Function} error
        * @return {CmisSession}
        */
        session.setGlobalHandlers = function (notOk, error) {
            _globalNotOk = notOk || _noop;
            _globalError = error || _noop;
            return session;
        };

        /**  
        * Connects to a cmis server and retrieves repositories, 
        * token or credentils must already be set
        *
        * @param {String} url (or path if running in the browser)  
        * @param {String} username  
        * @param {String} password 
        * @return {CmisRequest} request
        */
        session.loadRepositories = function () {
            var r = new CmisRequest(_get(url)).ok(function (res) {
                    for (var repo in res.body) {
                        session.defaultRepository = res.body[repo];
                        break;
                    }
                    session.repositories = res.body;

                    if (_afterlogin !== undefined) {
                        _afterlogin(res);
                    }
                });
            r.ok = function (callback) {
                _afterlogin = callback;
                return r;
            };
            return r;
        };


        /**
        * gets an object by objectId
        *
        * @param  {String}  objectId
        * @param  {Object}  options
        * @return {CmisRequest}
        */
        session.getObject = function (objectId, options) {
            options = _fill(options);
            options.cmisselector = 'object';
            options.objectId = objectId;
            return new CmisRequest(_get(session.defaultRepository.rootFolderUrl)
                .query(options));
        };

        /**
        * gets an object by path
        *
        * @param {String} path
        * @param {Object} options
        * @return {CmisRequest}
        */
        session.getObjectByPath = function (path, options) {
            options = _fill(options);
            options.cmisselector = 'object';
            
            return new CmisRequest(_get(session.defaultRepository.rootFolderUrl + path)
                .query(options));
        };

        /**
        * creates a new folder
        *
        * @param {String} parentId
        * @param {String/Object} input
        * if `input` is a string used as the folder name, 
        * if `input` is an object it must contain required properties: 
        *   {'cmis:name': 'aFolder', 'cmis:objectTypeId': 'cmis:folder'}
        * @return {CmisRequest}
        */    
        session.createFolder = function (parentId, input, policies, addACEs, removeACEs){
            var options = _fill({});
            if ('string' == typeof input){
                input = {'cmis:name': input};
            }
            var properties = input || {};
            if (!properties['cmis:objectTypeId']) {
                properties['cmis:objectTypeId'] = 'cmis:folder';   
            }
            options.objectId = parentId;
            _setProps(properties, options);
            options.repositoryId = session.defaultRepository.repositoryId;
            options.cmisaction = 'createFolder';
            return new CmisRequest(_post(session.defaultRepository.rootFolderUrl)
                .send(options));
        }

        /**
        * deletes an object
        * @method deleteObject
        * @param {String} objectId
        * @param {Boolean} allVersions
        * @return {CmisRequest}
        */    
        session.deleteObject = function (objectId, allVersions){
            var options = _fill({});
            options.repositoryId = session.defaultRepository.repositoryId;
            options.cmisaction = 'delete';
            options.objectId = objectId;
            options.allVersions = !!allVersions;
            return new CmisRequest(_post(session.defaultRepository.rootFolderUrl)
                .send(options));
        }


        /**
         * gets repository informations
         * @method getRepositoryInfo
         * @param {Object} options
         * @return CmisRequest
         */
        session.getRepositoryInfo = function (options) {
            options = _fill(options);
            options.cmisselector = 'repositoryInfo';
            return new CmisRequest(_get(session.defaultRepository.repositoryUrl)
                .query(options));
        };

        /**
         * gets the types that are immediate children 
         * of the specified typeId, or the base types if no typeId is provided
         * @method getTypeChildren
         * @param {String} typeId
         * @param {Boolean} includePropertyDefinitions
         * @param {Object} options
         * @return CmisRequest
         */
        session.getTypeChildren = function (typeId, includePropertyDefinitions, options) {
            options = _fill(options);
            if (typeId) {
                options.typeId = typeId;                
            }
            options.includePropertyDefinitions = includePropertyDefinitions;
            options.cmisselector = 'typeChildren'
            return new CmisRequest(_get(session.defaultRepository.repositoryUrl)
                .query(options));
        };

        /**
         * gets all types descended from the specified typeId, or all the types
         * in the repository if no typeId is provided
         * @method getTypeDescendants
         * @param {String} typeId
         * @param {Integer} depth
         * @param {Boolean} includePropertyDefinitions
         * @param {Object} options
         * @return CmisRequest
         */
        session.getTypeDescendants = function (typeId, depth, includePropertyDefinitions, options) {
            options = _fill(options);
            if (typeId) {
                options.typeId = typeId;                
            }
            options.depth = depth || 1;
            options.includePropertyDefinitions = includePropertyDefinitions;
            options.cmisselector = 'typeDescendants'
            return new CmisRequest(_get(session.defaultRepository.repositoryUrl)
                .query(options));

        };

        /**
         * gets definition of the specified type
         * @method getTypeDefinition
         * @param {String} typeId
         * @param {Boolean} options
         * @return CmisRequest
         */
        session.getTypeDefinition = function (typeId, options) {
            options = _fill(options);
            options.typeId = typeId;                
            options.cmisselector = 'typeDefinition'
            return new CmisRequest(_get(session.defaultRepository.repositoryUrl)
                .query(options));

        };

        /**
         * gets the documents that have been checked out in the repository
         * @method getCheckedOutDocs
         * @param {String} objectId
         * @return 
         */
        session.getCheckedOutDocs = function (objectId, options) {
            options = _fill(options);
            if (objectId){
                options.objectId = objectId;
            }
            options.cmisselector = 'checkedOut'
            return new CmisRequest(_get(session.defaultRepository.repositoryUrl)
                .query(options));

        };

        /**
        * creates a new document
        *
        * @param {String} parentId
        * @param {String/Object} input
        * if `input` is a string used as the document name, 
        * if `input` is an object it must contain required properties: 
        *   {'cmis:name': 'docName', 'cmis:objectTypeId': 'cmis:document'}
        * @param {String/Buffer} content
        * @return {CmisRequest}
        */    
        session.createDocument = function (parentId, input, content, versioningState, policies, addACES, removeACEs, options) {
            var options = _fill(options);
            if ('string' == typeof input){
                input = {'cmis:name': input};
            }
            var properties = input || {};
            if (!properties['cmis:objectTypeId']) {
                properties['cmis:objectTypeId'] = 'cmis:document';   
            }
            if (versioningState){
                options.versioningState = versioningState;
            }
            //options.content = content;
            options.objectId = parentId;
            _setProps(properties, options);
            options.repositoryId = session.defaultRepository.repositoryId;
            options.cmisaction = 'createDocument';

            var req = _post(session.defaultRepository.rootFolderUrl)
            req.type('multipart/form-data')
                .part()
                .set('Content-Disposition', 'form-data; name="content"; filename="'
                    + properties['cmis:name'] + '"')
                .write(content);
            for (var k in options){
                req.part()
                    .set('Content-Disposition', 'form-data; name="'+k+'"')
                    .set('Content-Type', 'text/plain')
                    .write(''+options[k]);

            }

            return new CmisRequest(req);

        };

        /**
         * Not yet implemented
         * @method createDocumentFromSource
         * @return 
         */
        session.createDocumentFromSource = function () {};

        /**
        * Creates a relationship
        * @method createRelationship
        * @param {Object} properties
        * @return {CmisRequest}
        */
        session.createRelationship = function (properties, policies, addACES, removeACEs, options) {
            options = _fill(options);
            _setProps(properties, options);
            options.cmisaction = 'createRelationship';
            return new CmisRequest(_post(session.defaultRepository.rootFolderUrl)
                .send(options));
        };

        /**
         * Creates a policy
         * @method createPolicy
         * @param {String} objectId
         * @param {Object} properties
         * @return {CmisRequest}
         */
        session.createPolicy = function (objectId, properties, policies, addACES, removeACEs, options) {
            options = _fill(options);
            options.objectId = objectId;
            _setProps(properties, options);
            options.cmisaction = 'createPolicy';
            return new CmisRequest(_post(session.defaultRepository.rootFolderUrl)
                .send(options));

        };

        /**
         * Creates an item
         * @method createItem
         * @param {String} parentId
         * @param {Object} properties
         * @return {CmisRequest}
         */
        session.createItem = function (parentId, properties, policies, addACES, removeACEs, options) {
            options = _fill(options);
            options.objectId = folderId;
            _setProps(properties, options);
            options.cmisaction = 'createItem';
            return new CmisRequest(_post(session.defaultRepository.rootFolderUrl)
                .send(options));

        };

        /**
         * Updates properties of specified objects
         * @method bulkUpdateProperties
         * @param {Array} objectIds
         * @param {Object} properties
         * @param {Options} options
         * @return CmisRequest
         */
        session.bulkUpdateProperties = function (objectIds, properties, options) {
            var options = _fill(options);
            for (var i = objectIds.length - 1; i >= 0; i--) {
                options['objectId['+i+']']=objectIds[i];
            }
            options.objectIds = objectIds;
            _setProps(properties, options);
            options.cmisaction = 'bulkUpdate';
            return new CmisRequest(_post(session.defaultRepository.repositoryUrl)
                .send(options));

        };    

        /**
         * performs a cmis query against the repository
         * @method query
         * @param {String} statement
         * @param {Boolean} searchAllversions
         * @param {Object} options
         * @return 
         */
        session.query = function (statement, searchAllversions, options) {
            options = _fill(options);
            options.cmisaction = 'query';
            options.statement = statement;
            options.searchAllversions = !!searchAllversions;
            return new CmisRequest(_post(session.defaultRepository.repositoryUrl)
                .send(options));

        };

        /**
         * gets the changed objects, the list object should contain the next change log token.
         * @method getContentChanges
         * @param {String} changeLogToken
         * @param {Boolean} includeProperties
         * @param {Boolean} includePolicyIds
         * @param {Boolean} includeACL
         * @param {Object} options
         * @return 
         */
        session.getContentChanges = function (changeLogToken, includeProperties, includePolicyIds, includeACL, options) {
            options = _fill(options);
            options.cmisselector = 'contentChanges';
            if (changeLogToken) {
                options.changeLogToken = changeLogToken;
            }
            options.includeProperties = !! includeProperties;
            options.includePolicyIds = !! includePolicyIds;
            options.includeACL = !! includeACL;
            return new CmisRequest(_get(session.defaultRepository.repositoryUrl)
                .query(options));            
        };

        /**
         * Creates a new type
         * @method createType
         * @param {Object} type
         * @param {Object} options
         * @return CmisRequest
         *
         */
        session.createType = function (type, options) {
            options = _fill(options);
            options.cmisaction = 'createType';
            options.type = JSON.stringify(type);
            return new CmisRequest(_post(session.defaultRepository.repositoryUrl)
                .send(options));          
        };

        /**
         * Updates a type definition
         * @method updateType
         * @param {Object} type
         * @param {Object} options
         * @return CmisRequest
         */
        session.updateType = function (type, options) {
            options = _fill(options);
            options.cmisaction = 'updateType';
            options.type = JSON.stringify(type);
            return new CmisRequest(_post(session.defaultRepository.repositoryUrl)
                .send(options));          

        };

        /**
         * Deletes specified type
         * @method deleteType
         * @param {String} typeId
         * @param {Object} options
         * @return CmisRequest
         */
        session.deleteType = function (typeId, options) {
            options = _fill(options);
            options.cmisaction = 'deleteType';
            options.typeId = typeId;
            return new CmisRequest(_post(session.defaultRepository.repositoryUrl)
                .send(options));          
        };


        /**
         * Returns children of object specified by id
         * @method getChildren
         * @param {String} objectId
         * @param {Object} options
         * @return CmisRequest
         */
        session.getChildren = function (objectId, options) {
            options = _fill(options);
            options.cmisselector = 'children';
            options.objectId = objectId;
            return new CmisRequest(_get(session.defaultRepository.rootFolderUrl)
                .query(options));          
        };

        /**
         * Gets all descendants of specified folder
         * @method getDescendants
         * @param {String} folderId
         * @param {Integer} depth
         * @param {Object} options
         * @return CmisRequest
         */
        session.getDescendants = function (folderId, depth, options) {
            options = _fill(options);
            options.cmisselector = 'descendants';
            if (depth){
                options.depth = depth;
            }
            options.objectId = folderId;
            return new CmisRequest(_get(session.defaultRepository.rootFolderUrl)
                .query(options));          
        };

        /**
         * Gets the folder tree of the specified folder
         * @param {String} folderId
         * @param {Integer} depth
         * @param {Object} options
         * @return CmisRequest
         */
        session.getFolderTree = function (folderId, depth, options) {
            options = _fill(options);
            options.cmisselector = 'folderTree';
            if (depth){
                options.depth = depth;
            }
            options.objectId = folderId;
            return new CmisRequest(_get(session.defaultRepository.rootFolderUrl)
                .query(options));          
        };

        /**
         * Gets the parent folder of the specified folder
         * @method getFolderParent
         * @param {String} folderId
         * @param {Object} options
         * @return CmisRequest
         */
        session.getFolderParent = function (folderId, options) {
            options = _fill(options);
            options.cmisselector = 'parent';
            options.objectId = folderId;
            return new CmisRequest(_get(session.defaultRepository.rootFolderUrl)
                .query(options));                      
        };

        /**
         * Gets the folders that are the parents of the specified object
         * @method getFolderParent
         * @param {String} folderId
         * @param {Object} options
         * @return CmisRequest
         */
        session.getParents = function (objectId, options) {
            options = _fill(options);
            options.cmisselector = 'parents';
            options.objectId = objectId;
            return new CmisRequest(_get(session.defaultRepository.rootFolderUrl)
                .query(options));                      
        };

        /**
         * Gets the allowable actions of the specified object
         * @method getAllowableActions
         * @param {String} objectId
         * @param {Object} options
         * @return CmisRequest
         */
        session.getAllowableActions = function(objectId, options) {
            options = _fill(options);
            options.cmisselector = 'allowableActions';
            options.objectId = objectId;
            return new CmisRequest(_get(session.defaultRepository.rootFolderUrl)
                .query(options));                      
        };

        /**
         * Gets the properties of the specified object
         * @method getProperties
         * @param {String} objectId
         * @param {Object} options
         * @return CmisRequest
         */
        session.getProperties = function (objectId, options) {
            options = _fill(options);
            options.cmisselector = 'properties';
            options.objectId = objectId;
            return new CmisRequest(_get(session.defaultRepository.rootFolderUrl)
                .query(options));                      
        };

        /**
         * Gets document content
         * @method getContentStream
         * @param {String} objectId
         * @param {Boolean} download
         * @param {Object} options
         * @return CmisRequest
         */
        session.getContentStream = function (objectId, download, options) {
            options = _fill(options);
            options.cmisselector = 'content';
            options.objectId = objectId;
            options.download = !!download;
            return new CmisRequest(_get(session.defaultRepository.rootFolderUrl)
                .query(options)); 
        };

        /**
         * Gets document content URL
         * @method getContentStreamURL
         * @param {String} objectId
         * @param {Boolean} download
         * @param {Object} options
         * @return String
         */
        session.getContentStreamURL = function (objectId, download, options) {
            options = _fill(options);
            options.cmisselector = 'content';
            options.objectId = objectId;
            options.download = !!download;
            return _get(session.defaultRepository.rootFolderUrl)
                .query(options).req.path; 
        };

        /**
         * gets document renditions
         * @method getRenditions
         * @param {String} objectId
         * @param {String} renditionFilter
         * @param {Object} options
         * @return CmisRequest
         */
        session.getRenditions = function (objectId, renditionFilter, options) {
            options = _fill(options);
            options.cmisselector = 'renditions';
            options.objectId = objectId;
            options.renditionFilter = renditionFilter || '*';
            
            return new CmisRequest(_get(session.defaultRepository.rootFolderUrl)
                .query(options)); 
          
        };

        /**
         * Updates properties of specified object
         * @method updateProperties
         * @param {Object} properties
         * @param {Options} options
         * @return CmisRequest
         */
        session.updateProperties = function (objectId, properties, options) {
            var options = _fill(options);
            options.objectId = objectId;
            _setProps(properties, options);
            options.cmisaction = 'update';
            return new CmisRequest(_post(session.defaultRepository.rootFolderUrl)
                .send(options));
        };    
        
        /**
         * Moves an object
         * @method moveObject
         * @param {String} objectId
         * @param {String} targeFolderId
         * @param {String} sourceFolderId
         * @param {Object} options
         * @return CmisRequest
         */
        session.moveObject = function (objectId, sourceFolderId, targetFolderId, options) {
            var options = _fill(options);
            options.objectId = objectId;
            options.cmisaction = 'move';
            options.targetFolderId = targetFolderId;
            options.sourceFolderId = sourceFolderId;
            return new CmisRequest(_post(session.defaultRepository.rootFolderUrl)
                .send(options));
        };

        /**
         * Deletes a folfder tree
         * @method deleteTree
         * @param {String} objectId
         * @param {Object} objectId
         * @return CmisRequest
         */
        session.deleteTree = function (objectId, allVersions, unfileObjects, continueOnFailure, options) {
            var options = _fill(options);
            options.repositoryId = session.defaultRepository.repositoryId;
            options.cmisaction = 'deleteTree';
            options.objectId = objectId;
            options.allVersions = !!allVersions;
            if (unfileObjects){
                options.unfileObjects = unfileObjects;
            }
            options.continueOnFailure = !!continueOnFailure;
            return new CmisRequest(_post(session.defaultRepository.rootFolderUrl)
                .send(options));

        };

        /**
         * Updates content of document
         * @method setContentStream
         * @param {String} objectId
         * @param {String/Buffer} content
         * @param {Boolesn} overwriteFlag
         * @param {Object} options
         * @return CmisRequest
         */
        session.setContentStream = function (objectId, content, overwriteFlag, mimeType, options) {
            var options = _fill(options);
            options.objectId = objectId;
            options.overwriteFlag = !!overwriteFlag;
            options.cmisaction = 'setContent';
            var req = _post(session.defaultRepository.rootFolderUrl)
            req.type('multipart/form-data')
                .part()
                .set('Content-Disposition', 
                    'form-data; name="content"; filename="data"')
                .set('Content-Type', 'text/plain')
                .write(content);
            for (var k in options){
                req.part()
                    .set('Content-Disposition', 'form-data; name="'+k+'"')
                    .set('Content-Type', mimeType)
                    .write(''+options[k]);

            }
            return new CmisRequest(req);
        };

        /**
         * Not yet implemented
         * @method appendContentStream
         * @param {} objectId
         * @return 
         */
        session.appendContentStream = function (objectId) {};

        /**
         * Not yet implemented
         * @method deleteContentStream
         * @param {} objectId
         * @return 
         */
        session.deleteContentStream = function (objectId) {};

        /**
         * Adds specified object to folder
         * @method addObjectToFolder
         * @param {String} objectId
         * @param {String} folderId
         * @param {Object} options
         * @return 
         */
        session.addObjectToFolder = function (objectId, folderId, options) {
            var options = _fill(options);
            options.objectId = objectId;
            options.cmisaction = 'addObjectToFolder';
            options.folderId = folderId;
            return new CmisRequest(_post(session.defaultRepository.rootFolderUrl)
                .send(options));
        };

        /**
         * Removes specified object from folder
         * @method addObjectToFolder
         * @param {String} objectId
         * @param {String} folderId
         * @param {Object} options
         * @return {CmisRequest}
         */
        session.removeObjectFromFolder = function (objectId, folderId, options) {
            var options = _fill(options);
            options.objectId = objectId;
            options.cmisaction = 'removeObjectFromFolder';
            options.folderId = folderId;
            return new CmisRequest(_post(session.defaultRepository.rootFolderUrl)
                .send(options));
        };

        /**
         * checks out a document
         * @method checkOut
         * @param {String} objectId
         * @param {Object} options
         * @return {CmisRequest}
         */
        session.checkOut = function (objectId, options) {
            var options = _fill(options);
            options.objectId = objectId;
            options.cmisaction = 'checkOut';
            return new CmisRequest(_post(session.defaultRepository.rootFolderUrl)
                .send(options));

        };

        /**
         * cancels a check out
         * @method cancelCheckOut
         * @param {String} objectId
         * @param {Object} options
         * @return CmisRequest 
         */
        session.cancelCheckOut = function (objectId, options) {
            var options = _fill(options);
            options.objectId = objectId;
            options.cmisaction = 'cancelCheckOut';
            return new CmisRequest(_post(session.defaultRepository.rootFolderUrl)
                .send(options));

        };

        /**
        * checks in a document
        *
        * @param {String} parentId
        * @param {String/Object} input
        * if `input` is a string used as the document name, 
        * if `input` is an object it must contain required properties: 
        *   {'cmis:name': 'docName', 'cmis:objectTypeId': 'cmis:document'}
        * @param {String/Buffer} content
        * @return {CmisRequest}
        */    
        session.checkIn = function (objectId, major, input, content, comment, policies, addACES, removeACEs, options) {
            var options = _fill(options);
            if ('string' == typeof input){
                input = {'cmis:name': input};
            }
            var properties = input || {};
            if (comment){
                options.checkInComment = comment;
            }
            //options.content = content;
            options.objectId = objectId;
            _setProps(properties, options);
            options.repositoryId = session.defaultRepository.repositoryId;
            options.cmisaction = 'checkIn';

            var req = _post(session.defaultRepository.rootFolderUrl)
            req.type('multipart/form-data')
                .part()
                .set('Content-Disposition', 'form-data; name="content"; filename="'
                    + properties['cmis:name'] + '"')
                .write(content);
            for (var k in options){
                req.part()
                    .set('Content-Disposition', 'form-data; name="'+k+'"')
                    .set('Content-Type', 'text/plain')
                    .write(''+options[k]);

            }

            return new CmisRequest(req);

        };
        /**
         * Not yet implemented
         * @method getObjectOfLatestVersion
         * @return 
         */
        session.getObjectOfLatestVersion = function () {};

        /**
         * Not yet implemented
         * @method getPropertiesOfLatestVersion
         * @return 
         */
        session.getPropertiesOfLatestVersion = function () {};

        /**
         * Not yet implemented
         * @method getAllVersions
         * @param {} filter
         * @param {} options
         * @return 
         */
        session.getAllVersions = function (filter, options) {};

        /**
         * Not yet implemented
         * @method getObjectRelationships
         * @param {} includeSubRelationshipTypes
         * @param {} relationshipDirection
         * @param {} typeId
         * @param {} options
         * @return 
         */
        session.getObjectRelationships = function(includeSubRelationshipTypes, relationshipDirection, typeId, options) {};

        /**
         * Not yet implemented
         * @method getAppliedPolicies
         * @param {} objectId
         * @param {} options
         * @return 
         */
        session.getAppliedPolicies = function (objectId, options) {};

        /**
         * Not yet implemented
         * @method applyPolicy
         * @param {} objectId
         * @param {} policyId
         * @param {} options
         * @return 
         */
        session.applyPolicy = function (objectId, policyId, options) {};

        /**
         * Not yet implemented
         * @method removePolicy
         * @param {} objectId
         * @param {} policyId
         * @param {} options
         * @return 
         */
        session.removePolicy = function (objectId, policyId, options) {};

        /**
         * Not yet implemented
         * @method applyACL
         * @param {} objectId
         * @return 
         */
        session.applyACL = function (objectId) {};

        /**
         * Not yet implemented
         * @method getACL
         * @return 
         */
        session.getACL = function () {};


        // http://visionmedia.github.io/superagent
        var request;

        // if running on node.js require superagent 
        if (typeof module !== 'undefined' && module.exports) {
            request = require('superagent');
        } else { 
            request = window.request;
        }

        /**
        * @class CmisRequest
        * superagent wrapper used to manage async requests
        * all cmis actions return a CmisRequest
        */
        function CmisRequest(req){

            var callback_ok = _noop;
            var callback_notOk = _globalNotOk;
            var callback_error = _globalError;

            req.on('error', callback_error)
                .end(function (res) {
                    if (res.ok) {
                        callback_ok(res);
                    } else {
                        callback_notOk(res);
                    }
                });

            /**
            * sets callback when response status == 2XX
            *
            * @param {Function} callback
            * @return {CmisRequest} 
            */
            this.ok = function (callback) {
                callback_ok = callback || _noop;
                return this;
            };

            /**
            * sets callback when response status != 2XX
            *
            * @param {Function} callback
            * @return {CmisRequest} 
            */        
            this.notOk = function (callback) {
                callback_notOk = callback || _noop;
                return this;
            };

            /**
            *  sets callback when response is in error
            *  (network, parsing errors etc..)
            *
            * @param {Function} callback
            * @return {CmisRequest} request
            */
            this.error = function (callback) {
                callback_error = callback || _noop;
                return this;
            };

        }


        //Private members and methods
        var _url = url;
        var _token = null;
        var _username = null;
        var _password = null;
        var _afterlogin;

        var _noop = function () {};

        var _globalNotOk = _noop;
        var _globalError = _noop;


        var _http = function (method, url) {
            var r = request(method, url);
            if (_username && _password) {
                return r.auth(_username, _password);
            }
            return r;
        };

        var _get = function (url) {
            return _http('GET', url);
        };

        var _post = function (url) {
            return _http('POST', url).type('form');
        };

        var _defaultOptions = {succinct: true};

        var _fill = function (options) {
            var o = {};
            for (var k in _defaultOptions) {
                o[k] = _defaultOptions[k];
            }
            if (options === undefined) {
                return o;
            }
            for (k in options) {
                o[k] = options[k];
            }
            return o;
        };

        var _setProps = function(properties, options){        
            var i = 0;
            for (var id in properties){
                options['propertyId['+i+']'] = id;
                options['propertyValue['+i+']'] = properties[id];
                i++;
            }
        };
        
        return session;
        };

    return lib;

}));
