'use strict';

/* Services */

angular.module('numen.cmis', [])

    .factory('CmisManagerFactory', ['$q', function($q) {

        return function(url, options) {

            var session = cmis.createSession(url);

            if (options.username && options.password) {
                session.setCredentials(options.username, options.password);
            }

            if (options.token) {
                session.setToken(options.token);
            }

            var errorCallback = options.errorCallback || ( function() {} );

            var deferredRepositories = $q.defer();

            var cmisManager = {};

            cmisManager.connect = function() {
                session.loadRepositories()
                    .ok(function(response) {
                        var isRepositoryFound = false;
                        for (var repositoryId in response) {
                            if (response.hasOwnProperty(repositoryId)) {
                                isRepositoryFound = true;
                                session.defaultRepository = response[repositoryId];
                                if (repositoryId == options.repositoryId) {
                                    break;
                                }
                            }
                        }
                        if (isRepositoryFound) {
                            deferredRepositories.resolve(response);
                        }
                        else {
                            errorCallback(response);
                            deferredRepositories.reject(response);
                        }
                    })
                    .notOk(function(response) {
                        errorCallback(response);
                        deferredRepositories.reject(response);
                    })
                    .error(function(response) {
                        errorCallback(response);
                        deferredRepositories.reject(response);
                    });
            };

            cmisManager.setCredentials = function(username, password) {
                session.setCredentials(username, password);
            };

            cmisManager.setToken = function(token) {
                session.setToken(token);
            };

            cmisManager.getRepositories = function() {
                return deferredRepositories.promise;
            };

            cmisManager.setCurrentRepository = function(repositoryId) {
                return deferredRepositories.promise.then(function(repositories) {
                    if (repositories[repositoryId]) {
                        session.defaultRepository = repositories[repositoryId];
                        return { status : 0, message : "Repository ID successfully set to '" + repositoryId + "'" };
                    }
                    else {
                        var result = { status : 1, message : "Unavailable repository ID '" + repositoryId + "'" };
                        errorCallback(result);
                        return $q.reject(result);
                    }
                });
            };

            var cmisMethods = [
                { name : 'addObjectToFolder', isCmisRequest : true },
                { name : 'appendContentStream', isCmisRequest : true },
                { name : 'applyACL', isCmisRequest : true },
                { name : 'applyPolicy', isCmisRequest : true },
                { name : 'bulkUpdateProperties', isCmisRequest : true },
                { name : 'cancelCheckOut', isCmisRequest : true },
                { name : 'checkIn', isCmisRequest : true },
                { name : 'checkOut', isCmisRequest : true },
                { name : 'createDocument', isCmisRequest : true },
                { name : 'createDocumentFromSource', isCmisRequest : true },
                { name : 'createFolder', isCmisRequest : true },
                { name : 'createItem', isCmisRequest : true },
                { name : 'createPolicy', isCmisRequest : true },
                { name : 'createRelationship', isCmisRequest : true },
                { name : 'createType', isCmisRequest : true },
                { name : 'deleteContentStream', isCmisRequest : true },
                { name : 'deleteObject', isCmisRequest : true },
                { name : 'deleteTree', isCmisRequest : true },
                { name : 'deleteType', isCmisRequest : true },
                { name : 'getACL', isCmisRequest : true },
                { name : 'getAllVersions', isCmisRequest : true },
                { name : 'getAllowableActions', isCmisRequest : true },
                { name : 'getAppliedPolicies', isCmisRequest : true },
                { name : 'getCheckedOutDocs', isCmisRequest : true },
                { name : 'getChildren', isCmisRequest : true },
                { name : 'getContentChanges', isCmisRequest : true },
                { name : 'getContentStream', isCmisRequest : true },
                { name : 'getContentStreamURL', isCmisRequest : false },
                { name : 'getDescendants', isCmisRequest : true },
                { name : 'getFolderParent', isCmisRequest : true },
                { name : 'getFolderTree', isCmisRequest : true },
                { name : 'getLastResult', isCmisRequest : true },
                { name : 'getObject', isCmisRequest : true },
                { name : 'getObjectByPath', isCmisRequest : true },
                { name : 'getObjectRelationships', isCmisRequest : true },
                { name : 'getParents', isCmisRequest : true },
                { name : 'getProperties', isCmisRequest : true },
                { name : 'getRenditions', isCmisRequest : true },
                { name : 'getRepositoryInfo', isCmisRequest : true },
                { name : 'getTypeChildren', isCmisRequest : true },
                { name : 'getTypeDefinition', isCmisRequest : true },
                { name : 'getTypeDescendants', isCmisRequest : true },
                { name : 'moveObject', isCmisRequest : true },
                { name : 'query', isCmisRequest : true },
                { name : 'removeObjectFromFolder', isCmisRequest : true },
                { name : 'removePolicy', isCmisRequest : true },
                { name : 'setContentStream', isCmisRequest : true },
                { name : 'updateProperties', isCmisRequest : true },
                { name : 'updateType', isCmisRequest : true }
            ];

            for (var i=0; i<cmisMethods.length; i++) {

                if (cmisMethods[i].isCmisRequest) {

                    (function() {

                        var methodName = cmisMethods[i].name;
                        cmisManager[methodName] = function() {

                            var cmisArguments = arguments;

                            return deferredRepositories.promise.then(function() {

                                var deferred = $q.defer();

                                session[methodName].apply(session, cmisArguments)
                                    .ok(function(response) {
                                        deferred.resolve(response);
                                    })
                                    .notOk(function(response) {
                                        errorCallback(response);
                                        deferred.reject(response);
                                    })
                                    .error(function(response) {
                                        errorCallback(response);
                                        deferred.reject(response);
                                    });

                                return deferred.promise;
                            });
                        };

                    })();

                }
                else {

                    (function() {

                        var methodName = cmisMethods[i].name;
                        cmisManager[methodName] = function() {

                            var cmisArguments = arguments;

                            return deferredRepositories.promise.then(function() {

                                return session[methodName].apply(session, cmisArguments);
                            });
                        };

                    })();

                }

            }

            return cmisManager;

        };

    }])

;
