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

    var lib = {};

    /**
    * 
    *
    */

    lib.createSession = function(url){

        /**
        * @class CmisSession
        *
        * the session is the enrty point for all cmis requests
        * before making any request, session.loadRepository() must be invoked
        *
        *      var session = cmis.createSession(url);
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
         * Get repository informations
         * @method getRepositoryInfo
         * @param {} options
         * @return CallExpression
         */
        session.getRepositoryInfo = function (options) {
            options = _fill(options);
            oprions.cmisselector = 'repositoryInfo';
            return new CmisRequest(_get(session.defaultRepository.repositoryUrl))
                .query(options);
        };

        /**
         * Description
         * @method getTypeChildren
         * @param {} typeId
         * @param {} includePropertyDefinitions
         * @param {} options
         * @return 
         */
        session.getTypeChildren = function (typeId, includePropertyDefinitions, options) {};

        /**
         * Description
         * @method getTypeDescendants
         * @param {} typeId
         * @param {} depth
         * @param {} includePropertyDefinitions
         * @param {} options
         * @return 
         */
        session.getTypeDescendants = function (typeId, depth, includePropertyDefinitions, options) {};

        /**
         * Description
         * @method getTypeDefinition
         * @param {} typeId
         * @param {} options
         * @return 
         */
        session.getTypeDefinition = function (typeId, options) {};

        /**
         * Description
         * @method getCheckedOutDocs
         * @param {} objectId
         * @param {} filter
         * @return 
         */
        session.getCheckedOutDocs = function (objectId, filter) {};

        /**
         * Description
         * @method createDocument
         * @return 
         */
        session.createDocument = function () {};

        /**
         * Description
         * @method createDocumentFromSource
         * @return 
         */
        session.createDocumentFromSource = function () {};

        /**
        * Description
        * @method createRelationship
        * @return 
        */
       session.createRelationship = function () {};

        /**
         * Description
         * @method createPolicy
         * @return 
         */
        session.createPolicy = function () {};

        /**
         * Description
         * @method createItem
         * @return 
         */
        session.createItem = function () {};

        /**
         * Description
         * @method bulkUpdateProperties
         * @return 
         */
        session.bulkUpdateProperties = function () {};

        /**
         * Description
         * @method query
         * @param {} statement
         * @param {} searchAllversions
         * @param {} options
         * @return 
         */
        session.query = function (statement, searchAllversions, options) {};

        /**
         * Description
         * @method getContentChanges
         * @param {} changeLogToken
         * @param {} includeProperties
         * @param {} includePolicyIds
         * @param {} includeACL
         * @param {} options
         * @return 
         */
        session.getContentChanges = function (changeLogToken, includeProperties, includePolicyIds, includeACL, options) {};

        /**
         * Description
         * @method createType
         * @param {} type
         * @param {} options
         * @return 
         */
        session.createType = function (type, options) {};

        /**
         * Description
         * @method updateType
         * @param {} type
         * @param {} options
         * @return 
         */
        session.updateType = function (type, options) {};

        /**
         * Description
         * @method deleteType
         * @param {} type
         * @param {} options
         * @return 
         */
        session.deleteType = function (type, options) {};

        /**
         * Description
         * @method getLastResult
         * @param {} options
         * @return 
         */
        session.getLastResult = function (options) {};

        /**
         * Description
         * @method getChildren
         * @param {} objectId
         * @param {} options
         * @return 
         */
        session.getChildren = function (objectId, options) {};

        /**
         * Description
         * @method getDescendants
         * @param {} objectId
         * @param {} options
         * @return 
         */
        session.getDescendants = function (objectId, options) {};

        /**
         * Description
         * @method getFolderTree
         * @param {} objectId
         * @param {} options
         * @return 
         */
        session.getFolderTree = function (objectId, options) {};

        /**
         * Description
         * @method getFolderParent
         * @param {} objectId
         * @param {} options
         * @return 
         */
        session.getFolderParent = function (objectId, options) {};

        /**
         * Description
         * @method getObjectParents
         * @param {} objectId
         * @param {} options
         * @return 
         */
        session.getObjectParents = function (objectId, options) {};

        /**
         * Description
         * @method getAllowableActions
         * @param {} objectId
         * @param {} options
         * @return 
         */
        session.getAllowableActions = function(objectId, options) {};

        /**
         * Description
         * @method getProperties
         * @param {} objectId
         * @param {} options
         * @return 
         */
        session.getProperties = function (objectId, options) {};

        /**
         * Description
         * @method getContentStream
         * @param {} streamId
         * @param {} download
         * @param {} options
         * @return 
         */
        session.getContentStream = function (streamId, download, options) {};

        /**
         * Description
         * @method getRenditions
         * @param {} renditionFilter
         * @param {} options
         * @return 
         */
        session.getRenditions = function (renditionFilter, options) {};

        /**
         * Description
         * @method updateProperties
         * @param {} properties
         * @param {} options
         * @return 
         */
        session.updateProperties = function (properties, options) {};    
        
        /**
         * Description
         * @method moveObject
         * @param {} targetId
         * @param {} sourceId
         * @param {} options
         * @return 
         */
        session.moveObject = function (targetId, sourceId, options) {};

        /**
         * Description
         * @method deleteTree
         * @param {} objectId
         * @return 
         */
        session.deleteTree = function (objectId) {};

        /**
         * Description
         * @method setContentStream
         * @param {} objectId
         * @return 
         */
        session.setContentStream = function (objectId) {};

        /**
         * Description
         * @method appendContentStream
         * @param {} objectId
         * @return 
         */
        session.appendContentStream = function (objectId) {};

        /**
         * Description
         * @method deleteContentStream
         * @param {} objectId
         * @return 
         */
        session.deleteContentStream = function (objectId) {};

        /**
         * Description
         * @method addObjectToFolder
         * @param {} folderId
         * @param {} allVersions
         * @param {} options
         * @return 
         */
        session.addObjectToFolder = function (folderId, allVersions, options) {};

        /**
         * Description
         * @method removeObjectFromFolder
         * @param {} folderId
         * @param {} options
         * @return 
         */
        session.removeObjectFromFolder = function (folderId, options) {};

        /**
         * Description
         * @method checkOut
         * @param {} objectId
         * @param {} options
         * @return 
         */
        session.checkOut = function (objectId, options) {};

        /**
         * Description
         * @method cancelCheckOut
         * @param {} objectId
         * @param {} options
         * @return 
         */
        session.cancelCheckOut = function (objectId, options) {};

        /**
         * Description
         * @method checkIn
         * @return 
         */
        session.checkIn = function () {};

        /**
         * Description
         * @method getObjectOfLatestVersion
         * @return 
         */
        session.getObjectOfLatestVersion = function () {};

        /**
         * Description
         * @method getPropertiesOfLatestVersion
         * @return 
         */
        session.getPropertiesOfLatestVersion = function () {};

        /**
         * Description
         * @method getAllVersions
         * @param {} filter
         * @param {} options
         * @return 
         */
        session.getAllVersions = function (filter, options) {};

        /**
         * Description
         * @method getObjectRelationships
         * @param {} includeSubRelationshipTypes
         * @param {} relationshipDirection
         * @param {} typeId
         * @param {} options
         * @return 
         */
        session.getObjectRelationships = function(includeSubRelationshipTypes, relationshipDirection, typeId, options) {};

        /**
         * Description
         * @method getAppliedPolicies
         * @param {} objectId
         * @param {} options
         * @return 
         */
        session.getAppliedPolicies = function (objectId, options) {};

        /**
         * Description
         * @method applyPolicy
         * @param {} objectId
         * @param {} policyId
         * @param {} options
         * @return 
         */
        session.applyPolicy = function (objectId, policyId, options) {};

        /**
         * Description
         * @method removePolicy
         * @param {} objectId
         * @param {} policyId
         * @param {} options
         * @return 
         */
        session.removePolicy = function (objectId, policyId, options) {};

        /**
         * Description
         * @method applyACL
         * @param {} objectId
         * @return 
         */
        session.applyACL = function (objectId) {};

        /**
         * Description
         * @method getACL
         * @return 
         */
        session.getACL = function () {};


        /**
        * @class Request
        * [http://visionmedia.github.io/superagent](http://visionmedia.github.io/superagent) 
        * is used for ajax calls
        */
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

            req.end(function (err, res) {
                if (err) {
                    callback_error(err, res);
                } else {
                    if (res.ok) {
                        callback_ok(res);
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
            return r.auth(_username, _password);
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
