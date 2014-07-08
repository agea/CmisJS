;(function (root, factory) {
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

    //check if we are running on node
    var isNode = typeof module !== 'undefined' && module.exports;
    if(isNode){
        module.exports = lib;
    }
    /**
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
        };

        /**
        * sets credentials for authentication 
        *
        * @param {String} username
        * @param {String} password
        * @return {CmisSession}
        */
        session.setCredentials = function (username, password) {
            _username = username;
            _password = password;
            return session;
        };

        /**
        * sets global handlers for non ok and error responses
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
        * @return {CmisRequest} request
        */
        session.loadRepositories = function () {
            var r = new CmisRequest(_get(url)).ok(function (data) {
                    for (var repo in data) {
                        session.defaultRepository = data[repo];
                        break;
                    }
                    session.repositories = data;

                    if (_afterlogin !== undefined) {
                        _afterlogin(data);
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
        * @param {String} objectId
        * @param {String} returnVersion (if set must be one of 'this', latest' or 'latestmajor')
        * @param {Object} options (possible options: filter, renditionFilter, includeAllowableActions, includeRelationships, includeACL, includePolicyIds, succinct, token)
        * @return {CmisRequest}
        */
        session.getObject = function (objectId, returnVersion, options) {
            options = _fill(options);
            options.cmisselector = 'object';
            options.objectId = objectId;
            if (returnVersion && returnVersion != 'this') {
                options.major = (returnVersion == 'latestmajor');
            }
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
        * @param {Array} policies
        * @param {Object} addACEs
        * @param {Object} removeACEs
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
            if (policies){
                _setPolicies(policies, options);
            }
            if (addACEs){
                _setACEs(addACEs,'add', options);
            }
            if (removeACEs){
                _setACEs(removeACEs,'remove', options);
            }
            options.repositoryId = session.defaultRepository.repositoryId;
            options.cmisaction = 'createFolder';
            return new CmisRequest(_post(session.defaultRepository.rootFolderUrl)
                .send(options));
        };

        /**
        * deletes an object
        * @param {String} objectId
        * @param {Boolean} allVersions
        * @param {Object} options (possible options: token)
        * @return {CmisRequest}
        */    
        session.deleteObject = function (objectId, allVersions, options){
            var options = _fill(options);
            options.repositoryId = session.defaultRepository.repositoryId;
            options.cmisaction = 'delete';
            options.objectId = objectId;
            options.allVersions = !!allVersions;
            return new CmisRequest(_post(session.defaultRepository.rootFolderUrl)
                .send(options));
        };


        /**
         * gets repository informations
         * @param {Object} options (possible options: token)
         * @return {CmisRequest}
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
         * @param {String} typeId
         * @param {Boolean} includePropertyDefinitions
         * @param {Object} options (possible options: maxItems, skipCount, token)
         * @return {CmisRequest}
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
         * @param {String} typeId
         * @param {Integer} depth
         * @param {Boolean} includePropertyDefinitions
         * @param {Object} options (possible options: token)
         * @return {CmisRequest}
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
         * @param {String} typeId
         * @param {Object} options (possible options: token)
         * @return {CmisRequest}
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
         * @param {String} objectId
         * @param {Object} options (possible options: filter, maxItems, skipCount, orderBy, renditionFilter, includeAllowableActions, includeRelationships, succinct, token)
         * @return {CmisRequest}
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
        * @param {String/Buffer/Blob} content
        * @param {String/Object} input
        * if `input` is a string used as the document name, 
        * if `input` is an object it must contain required properties: 
        *   {'cmis:name': 'docName', 'cmis:objectTypeId': 'cmis:document'}
        * @param {String} mimeType 
        * @param {String} versioningState  (if set must be one of: "none", "major", "minor", "checkedout")
        * @param {Array} policies
        * @param {Object} addACEs
        * @param {Object} removeACEs
        * @param {Object} options (possible options: succinct, token)
        * @return {CmisRequest}
        */    
        session.createDocument = function (parentId, content, input, mimeType, versioningState, policies, addACEs, removeACEs, options) {
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

            options.objectId = parentId;
            _setProps(properties, options);
            if (policies){
                _setPolicies(policies, options);
            }
            if (addACEs){
                _setACEs(addACEs,'add', options);
            }
            if (removeACEs){
                _setACEs(removeACEs,'remove', options);
            }
            options.repositoryId = session.defaultRepository.repositoryId;
            options.cmisaction = 'createDocument';

            return  _postMultipart(session.defaultRepository.rootFolderUrl, 
                options, content, mimeType, properties['cmis:name']);

        };


        /**
        * creates a document object as a copy of the given source document 
        *
        * @param {String} parentId
        * @param {String} sourceId
        * @param {String/Buffer/Blob} content
        * @param {String/Object} input
        * if `input` is a string used as the document name, 
        * if `input` is an object it must contain required properties: 
        *   {'cmis:name': 'docName', 'cmis:objectTypeId': 'cmis:document'}
        * @param {String} mimeType 
        * @param {String} versioningState  (if set must be one of: "none", "major", "minor", "checkedout")
        * @param {Array} policies
        * @param {Object} addACEs
        * @param {Object} removeACEs
        * @param {Object} options (possible options: succinct, token)
        * @return {CmisRequest}
        */    
        session.createDocumentFromSource = function (parentId, sourceId, content, input, mimeType, versioningState, policies, addACEs, removeACEs, options) {
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
            options.objectId = parentId;
            options.sourceId = sourceId;
            _setProps(properties, options);
            if (policies){
                _setPolicies(policies, options);
            }
            if (addACEs){
                _setACEs(addACEs,'add', options);
            }
            if (removeACEs){
                _setACEs(removeACEs,'remove', options);
            }
            options.repositoryId = session.defaultRepository.repositoryId;
            options.cmisaction = 'createDocumentFromSource';

            return  _postMultipart(session.defaultRepository.rootFolderUrl, 
                options, content, mimeType, properties['cmis:name']);

        };

        /**
        * Creates a relationship
         * @param {Object} properties
         * @param {Array} policies
         * @param {Object} addACEs
         * @param {Object} removeACEs
         * @param {Object} options (possible options: succinct, token)
        * @return {CmisRequest}
        */
        session.createRelationship = function (properties, policies, addACEs, removeACEs, options) {
            options = _fill(options);
            _setProps(properties, options);
            if (policies){
                _setPolicies(policies, options);
            }
            if (addACEs){
                _setACEs(addACEs,'add', options);
            }
            if (removeACEs){
                _setACEs(removeACEs,'remove', options);
            }
            options.cmisaction = 'createRelationship';
            return new CmisRequest(_post(session.defaultRepository.repositoryUrl)
                .send(options));
        };

        /**
         * Creates a policy
         * @param {String} folderId
         * @param {Object} properties
         * @param {Array} policies
         * @param {Object} addACEs
         * @param {Object} removeACEs
         * @param {Object} options (possible options: succinct, token)
         * @return {CmisRequest}
         */
        session.createPolicy = function (folderId, properties, policies, addACEs, removeACEs, options) {
            options = _fill(options);
            options.objectId = folderId;
            _setProps(properties, options);
            if (policies){
                _setPolicies(policies, options);
            }
            if (addACEs){
                _setACEs(addACEs,'add', options);
            }
            if (removeACEs){
                _setACEs(removeACEs,'remove', options);
            }
            options.cmisaction = 'createPolicy';
            return new CmisRequest(_post(session.defaultRepository.rootFolderUrl)
                .send(options));
        };

        /**
         * Creates an item
         * @param {String} folderId
         * @param {Object} properties
         * @param {Array} policies
         * @param {Object} addACEs
         * @param {Object} removeACEs
         * @param {Object} options (possible options: succinct, token)
         * @return {CmisRequest}
         */
        session.createItem = function (folderId, properties, policies, addACEs, removeACEs, options) {
            options = _fill(options);
            options.objectId = folderId;
            _setProps(properties, options);
            if (policies){
                _setPolicies(policies, options);
            }
            if (addACEs){
                _setACEs(addACEs,'add', options);
            }
            if (removeACEs){
                _setACEs(removeACEs,'remove', options);
            }
            options.cmisaction = 'createItem';
            return new CmisRequest(_post(session.defaultRepository.rootFolderUrl)
                .send(options));
        };

        /**
         * Updates properties of specified objects
         * @param {Array} objectIds
         * @param {Object} properties
         * @param {Array} addSecondaryTypeIds
         * @param {Array} removeSecondaryTypeIds
         * @param {Options} options (possible options: token)
         * @return {CmisRequest}
         */
        session.bulkUpdateProperties = function (objectIds, properties, addSecondaryTypeIds, removeSecondaryTypeIds, options) {
            var options = _fill(options);
            for (var i = objectIds.length - 1; i >= 0; i--) {
                options['objectId['+i+']']=objectIds[i];
            }
            options.objectIds = objectIds;
            _setProps(properties, options);
            if (addSecondaryTypeIds){
                _setSecondaryTypeIds(addSecondaryTypeIds, 'add', options);
            }
            if (removeSecondaryTypeIds){
                _setSecondaryTypeIds(removeSecondaryTypeIds, 'remove', options);
            }
            options.cmisaction = 'bulkUpdate';
            return new CmisRequest(_post(session.defaultRepository.repositoryUrl)
                .send(options));

        };    

        /**
         * performs a cmis query against the repository
         * @param {String} statement
         * @param {Boolean} searchAllversions
         * @param {Object} options (possible options: maxItems, skipCount, orderBy, renditionFilter, includeAllowableActions, includeRelationships, succinct, token)
         * @return {CmisRequest}
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
         * @param {String} changeLogToken
         * @param {Boolean} includeProperties
         * @param {Boolean} includePolicyIds
         * @param {Boolean} includeACL
         * @param {Object} options (possible options: maxItems, succinct, token)
         * @return {CmisRequest}
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
         * @param {Object} type
         * @param {Object} options (possible options: token)
         * @return {CmisRequest}
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
         * @param {Object} type
         * @param {Object} options (possible options: token)
         * @return {CmisRequest}
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
         * @param {String} typeId
         * @param {Object} options (possible options: token)
         * @return {CmisRequest}
         */
        session.deleteType = function (typeId, options) {
            options = _fill(options);
            options.cmisaction = 'deleteType';
            options.typeId = typeId;
            return new CmisRequest(_post(session.defaultRepository.repositoryUrl)
                .send(options));          
        };

        /**
         * gets last result
         * @param {Object} options (possible options: token)
         * @return {CmisRequest}
         */
        session.getLastResult = function (options) {
            options = _fill(options);
            options.cmisaction = 'lastResult';
            return new CmisRequest(_post(session.defaultRepository.repositoryUrl)
                .send(options));          
        };


        /**
         * Returns children of object specified by id
         * @param {String} objectId
         * @param {Object} options (possible options: maxItems, skipCount, filter, orderBy, renditionFilter, includeAllowableActions, includeRelationships, includePathSegment, succinct, token)
         * @return {CmisRequest}
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
         * @param {String} folderId
         * @param {Integer} depth
         * @param {Object} options (possible options: filter, renditionFilter, includeAllowableActions, includeRelationships, includePathSegment, succinct, token)
         * @return {CmisRequest}
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
         * @param {Object} options (possible options: filter, renditionFilter, includeAllowableActions, includeRelationships, includePathSegment, succinct, token)
         * @return {CmisRequest}
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
         * @param {String} folderId
         * @param {Object} options (possible options: succinct, token)
         * @return {CmisRequest}
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
         * @param {String} objectId
         * @param {Object} options (possible options: filter, renditionFilter, includeAllowableActions, includeRelationships, includePathSegment, succinct, token)
         * @return {CmisRequest}
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
         * @param {String} objectId
         * @param {Object} options (possible options: filter, maxItems, skipCount, orderBy, renditionFilter, includeAllowableActions, includeRelationships, succinct, token)
         * @return {CmisRequest}
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
         * @param {String} objectId
         * @param {String} returnVersion (if set must be one of 'this', latest' or 'latestmajor')
         * @param {Object} options (possible options: filter, succinct, token)
         * @return {CmisRequest}
         */
        session.getProperties = function (objectId, returnVersion, options) {
            options = _fill(options);
            options.cmisselector = 'properties';
            options.objectId = objectId;
            if (returnVersion && returnVersion != 'this') {
                options.major = (returnVersion == 'latestmajor');
            }
            return new CmisRequest(_get(session.defaultRepository.rootFolderUrl)
                .query(options));                      
        };

        /**
         * Gets document content, WARNING: will not work for binary files (images, documents, ecc..)
         * @param {String} objectId
         * @param {Boolean} download
         * @param {Object} options (possible options: streamId, token)
         * @return {CmisRequest}
         */
        session.getContentStream = function (objectId, download, options) {
            options = _fill(options);
            options.cmisselector = 'content';
            options.objectId = objectId;
            options.download = (!!download) ? 'attachment' : 'inline';
            return new CmisRequest(_get(session.defaultRepository.rootFolderUrl)
                .query(options), true); 
        };

        if (isNode) {
            /**
             * pipes document content to stream - AVAILABLE ONLY IN NODE
             * @method pipeContentStream
             * @param {String} objectId
             * @param {Object} options (possible options: token)
             */
            session.pipeContentStream = function (objectId, options, stream) {
                options = _fill(options);
                options.cmisselector = 'content';
                options.objectId = objectId;
                _get(session.defaultRepository.rootFolderUrl)
                    .query(options).pipe(stream);
            };
        }

        /**
         * Gets document content URL
         * @param {String} objectId
         * @param {Boolean} download
         * @param {Object} options (possible options: streamId, token)
         * @return String
         */
        session.getContentStreamURL = function (objectId, download, options) {
            options = _fill(options);
            options.cmisselector = 'content';
            options.objectId = objectId;
            options.download = (!!download) ? 'attachment' : 'inline';

            var pairs = [];
            for (var key in options) {
            pairs.push(encodeURIComponent(key)
              + '=' + encodeURIComponent(options[key]));
            }
            var query = pairs.join('&');
            return session.defaultRepository.rootFolderUrl + '?' + query;
        };

        /**
         * gets document renditions
         * @param {String} objectId
         * @param {Object} options (possible options: renditionFilter, maxItems, skipCount, token)
         * @return {CmisRequest}
         */
        session.getRenditions = function (objectId, options) {
            options = _fill(options);
            options.cmisselector = 'renditions';
            options.objectId = objectId;
            options.renditionFilter = options.renditionFilter || '*';
            
            return new CmisRequest(_get(session.defaultRepository.rootFolderUrl)
                .query(options)); 
          
        };

        /**
         * Updates properties of specified object
         * @param {String} objectId
         * @param {Object} properties
         * @param {Object} options (possible options: changeToken, succinct, token)
         * @return {CmisRequest}
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
         * @param {String} objectId
         * @param {String} sourceFolderId
         * @param {String} targetFolderId
         * @param {Object} options (possible options: succinct, token)
         * @return {CmisRequest}
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
         * @param {String} objectId
         * @param {Boolean} allVersions 
         * @param {String} unfileObjects (if set must be one of 'unfile', 'deletesinglefiled', 'delete')
         * @param {Boolean} continueOnFailure
         * @param {Object} options (possible options: token)
         * @return {CmisRequest}
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
         * @param {String} objectId
         * @param {String/Buffer} content
         * @param {Boolean} overwriteFlag
         * @param {String} mimeType
         * @param {String} changeToken
         * @param {Object} options (possible options: changeToken, succinct, token)
         * @return {CmisRequest}
         */
        session.setContentStream = function (objectId, content, overwriteFlag, mimeType, changeToken, options) {
            var options = _fill(options);
            options.objectId = objectId;
            options.overwriteFlag = !!overwriteFlag;
            options.cmisaction = 'setContent';

            return  _postMultipart(session.defaultRepository.rootFolderUrl, 
                options, content, mimeType);

        };

        /**
         * Appends content to document
         * @param {String} objectId
         * @param {String/Buffer} content
         * @param {Boolean} isLastChunk
         * @param {Object} options (possible options: changeToken, succinct, token)
         * @return {CmisRequest}
         */
        session.appendContentStream = function (objectId, content, isLastChunk, options) {
            var options = _fill(options);
            options.objectId = objectId;
            options.cmisaction = 'appendContent';
            options.isLastChunk = !!isLastChunk;
            return  _postMultipart(session.defaultRepository.rootFolderUrl, 
                options, content);
        };

        /**
         * deletes object content
         * @param {String} objectId
         * @param {Object} options (possible options: changeToken, succinct, token)
         * @return {CmisRequest}
         */
        session.deleteContentStream = function (objectId, options) {
            var options = _fill(options);
            options.objectId = objectId;
            options.cmisaction = 'deleteContent';
            return new CmisRequest(_post(session.defaultRepository.rootFolderUrl)
                .send(options));
        };

        /**
         * Adds specified object to folder
         * @param {String} objectId
         * @param {String} folderId
         * @param {Boolean} allVersions
         * @param {Object} options (possible options: succinct, token)
         * @return {CmisRequest}
         */
        session.addObjectToFolder = function (objectId, folderId, allVersions, options) {
            var options = _fill(options);
            options.objectId = objectId;
            options.cmisaction = 'addObjectToFolder';
            options.allVersions = !!allVersions;
            options.folderId = folderId;
            return new CmisRequest(_post(session.defaultRepository.rootFolderUrl)
                .send(options));
        };

        /**
         * Removes specified object from folder
         * @param {String} objectId
         * @param {String} folderId
         * @param {Object} options (possible options: succinct, token)
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
         * @param {String} objectId
         * @param {Object} options
         * @return {CmisRequest} (possible options: succinct, token)
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
         * @param {String} objectId
         * @param {Object} options (possible options: token)
         * @return {CmisRequest} 
         */
        session.cancelCheckOut = function (objectId, options) {
            var options = _fill(options);
            options.objectId = objectId;
            options.cmisaction = 'cancelCheckOut';
            return new CmisRequest(_post(session.defaultRepository.rootFolderUrl)
                .send(options));

        };

        /**
        * checks in a document, if needed mimetype may be specified as 
        * input['cmis:contentStreamMimeType'] or as option.mimeType
        *
        * @param {String} objectId
        * @param {Boolean} major
        * @param {String/Object} input
        * if `input` is a string used as the document name, 
        * if `input` is an object it must contain required properties: 
        *   {'cmis:name': 'docName'}
        * @param {String/Buffer} content
        * @param {String} comment
        * @param {Array} policies
        * @param {Object} addACEs
        * @param {Object} removeACEs
        * @param {Object} options
        * @return {CmisRequest}
        */    
        session.checkIn = function (objectId, major, input, content, comment, policies, addACEs, removeACEs, options) {
            var options = _fill(options);
            if ('string' == typeof input){
                input = {'cmis:name': input};
            }
            var properties = input || {};
            if (comment){
                options.checkInComment = comment;
            }
            options.major = !!major
            options.objectId = objectId;
            _setProps(properties, options);
            if (policies){
                _setPolicies(policies, options);
            }
            if (addACEs){
                _setACEs(addACEs,'add', options);
            }
            if (removeACEs){
                _setACEs(removeACEs,'remove', options);
            }

            options.cmisaction = 'checkIn';

            return _postMultipart(session.defaultRepository.rootFolderUrl,
                options, content, options.mimeType || properties['cmis:contentStreamMimeType'], 
                properties['cmis:name'])

        };

        /**
         * gets versions of object
         * @param {String} objectId
         * @param {Object} options (possible options: filter, includeAllowableActions, succinct, token)
         * @return {CmisRequest}
         */
        session.getAllVersions = function (objectId, options) {
            var options = _fill(options);
            options.objectId = objectId;
            options.cmisselector = 'versions';
            return new CmisRequest(_get(session.defaultRepository.rootFolderUrl)
                .query(options));

        };

        /**
         * gets object relationships
         * @param {String} objectId
         * @param {Boolean} includeSubRelationshipTypes
         * @param {String} relationshipDirection
         * @param {String} typeId
         * @param {Object} options (possible options: maxItems, skipCount, includeAllowableActions, filter, succinct, token)
         * @return {CmisRequest}
         */
        session.getObjectRelationships = function(objectId, includeSubRelationshipTypes, relationshipDirection, typeId, options) {
            var options = _fill(options);
            options.objectId = objectId;
            options.includeSubRelationshipTypes = !! includeSubRelationshipTypes;
            options.relationshipDirection = relationshipDirection || 'either';
            if (typeId){
                options.typeId = typeId;
            }
            options.cmisselector = 'relationships';
            return new CmisRequest(_get(session.defaultRepository.rootFolderUrl)
                .query(options));
        };

        /**
         * gets object applied policies
         * @param {String} objectId
         * @param {Object} options (possible options: filter, succinct, token)
         * @return {CmisRequest}
         */
        session.getAppliedPolicies = function (objectId, options) {
            var options = _fill(options);
            options.objectId = objectId;
            options.cmisselector = 'policies';
            return new CmisRequest(_get(session.defaultRepository.rootFolderUrl)
                .query(options));

        };

        /**
         * applies policy to object
         * @param {String} objectId
         * @param {String} policyId
         * @param {Object} options (possible options: succinct, token)
         * @return {CmisRequest}
         */
        session.applyPolicy = function (objectId, policyId, options) {
            var options = _fill(options);
            options.objectId = objectId;
            options.policyId = policyId;
            options.cmisaction = 'applyPolicy';
            return new CmisRequest(_post(session.defaultRepository.rootFolderUrl)
                .send(options));
        };

        /**
         * removes policy from object
         * @param {String} objectId
         * @param {String} policyId
         * @param {Object} options (possible options: succinct, token)
         * @return {CmisRequest}
         */
        session.removePolicy = function (objectId, policyId, options) {
            var options = _fill(options);
            options.objectId = objectId;
            options.policyId = policyId;
            options.cmisaction = 'removePolicy';
            return new CmisRequest(_post(session.defaultRepository.rootFolderUrl)
                .send(options));

        };

        /**
         * applies ACL to object
         * @param {String} objectId
         * @param {Object} addACEs
         * @param {Object} removeACEs
         * @param {String} propagation
         * @param {Object} options (possible options: token)
         * @return {CmisRequest} 
         */
        session.applyACL = function (objectId, addACEs, removeACEs, propagation, options) {
            var options = _fill(options);
            options.objectId = objectId;
            options.policyId = policyId;
            options.cmisaction = 'applyACL';
            _setACEs(addACEs,'add', options);
            _setACEs(removeACEs,'remove', options);
            return new CmisRequest(_post(session.defaultRepository.rootFolderUrl)
                .send(options));
        };

        /**
         * gets object ACL
         * @param {String} objectId
         * @param {Boolean} onlyBasicPermissions
         * @param {Object} options (possible options: token)
         * @return {CmisRequest}
         */
        session.getACL = function (objectId, onlyBasicPermissions, options) {
            var options = _fill(options);
            options.objectId = objectId;
            options.onlyBasicPermissions = !! onlyBasicPermissions;
            options.cmisselector = 'acl';
            return new CmisRequest(_get(session.defaultRepository.rootFolderUrl)
                .query(options));
        };


        // http://visionmedia.github.io/superagent
        var request;

        // if running on node.js require superagent 
        if (typeof module !== 'undefined' && module.exports) {
            request = require('superagent');
        } else { 
            request = window.superagent;
        }

        /**
        * @class CmisRequest
        * superagent wrapper used to manage async requests
        * all cmis actions return a CmisRequest
        */
        function CmisRequest(req, text){

            var callback_ok = _noop;
            var callback_notOk = _globalNotOk;
            var callback_error = _globalError;

            req.on('error', callback_error)
                .end(function (res) {
                    if (res.ok) {
                        if (callback_ok.scope){
                            callback_ok.scope.$apply(function(){
                                if (text){
                                    callback_ok(res.text);
                                } else {
                                    callback_ok(res.body);
                                }                            
                            });
                        } else {
                            if (text){
                                callback_ok(res.text);
                            } else {
                                callback_ok(res.body);
                            }                            
                        }
                    } else {
                        if (callback_notOk.scope){
                            callback_notOk.scope.$apply(function(){
                                callback_notOk(res);
                            });
                        } else {
                            callback_notOk(res);
                        }
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
            * sets callback when response status == 2XX to be wrapped in scope.$apply()
            *
            * @param {Object} angularjs scope
            * @param {Function} callback
            * @return {CmisRequest} 
            */
            this.$ok = function (scope, callback) {
                callback.scope = scope;
                return this.ok(callback);
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
            * sets callback when response status != 2XX to be wrapped in scope.$apply()
            *
            * @param {Object} angularjs scope
            * @param {Function} callback
            * @return {CmisRequest} 
            */
            this.$notOk = function (scope, callback) {
                callback.scope = scope;
                return this.notOk(callback);
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

            /**
            *  sets callback when response is in error to be wrapped in scope.$apply()
            *  (network, parsing errors etc..)
            *
            * @param {Object} angularjs scope
            * @param {Function} callback
            * @return {CmisRequest} request
            */
            this.$error = function (scope, callback) {
                callback.scope = scope;
                return this.error(callback);
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

        var _postMultipart = function (url, options, content, mimeType) {
            var req = _post(url);


            if (!isNode){

                var data = new FormData();
                if (content){
                    if ('string' == typeof content) { 
                        content = new Blob([content]);//, {type:mimeType||'text/plain'});
                    }
                    data.append("content", content);                    
                }
                for (var k in options){
                    data.append(k, options[k]);
                }
                req.send(data);
                delete req.header['Content-Type'];

            } else {
                var p = req.type('multipart/form-data').part();
                p.set('Content-Disposition', 'form-data; name="content"; filename="data"');
                if (mimeType) {
                    p.set('Content-Type', mimeType);
                }
                p.write(content);
                for (var k in options){
                    req.part()
                        .set('Content-Disposition', 'form-data; name="'+k+'"')
                        .set('Content-Type', 'text/plain')
                        .write(''+options[k]);

                }                
            }
            return new CmisRequest(req);
        }

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
                var propertyValue = properties[id];
                if (toString.apply(propertyValue) == '[object Array]') {
                    for (var j=0;j<propertyValue.length;j++) {
                        options['propertyValue['+i+']['+j+']'] = propertyValue[j];
                    }
                }
                else {
                    options['propertyValue['+i+']'] = propertyValue;
                }
                i++;
            }
        };

        var _setPolicies = function(policies, options){        
            for (var i=0;i<policies.length;i++){
                options['policy['+i+']'] = policies[i];
            }
        };
        
        //action must be either 'add' or 'remove'
        var _setACEs = function(ACEs, action, options){        
            var i = 0;
            for (var id in ACEs){
                options[action + 'ACEPrincipal['+i+']'] = id;
                var ace = ACEs[id];
                for (var j=0;j<ace.length;j++) {
                    options[action+'ACEPermission['+i+']['+j+']'] = ACEs[id][j];
                }
                i++;
            }
        };
        
        //action must be either 'add' or 'remove'
        var _setSecondaryTypeIds = function(secondaryTypeIds, action, options){        
            for (var i=0;i<secondaryTypeIds.length;i++) {
                options[action+'SecondaryTypeId['+i+']'] = secondaryTypeIds[i];
            }
        };
        
        return session;
        };

    return lib;

}));
