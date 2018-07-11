"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("cross-fetch/polyfill");
var isomorphic_base64_1 = require("isomorphic-base64");
require("isomorphic-form-data");
require("url-search-params-polyfill");
var cmis;
(function (cmis) {
    var Buffer = global['Buffer'];
    var Options = (function () {
        function Options() {
            this.succinct = true;
        }
        return Options;
    }());
    ;
    var HTTPError = (function (_super) {
        __extends(HTTPError, _super);
        function HTTPError(response) {
            var _this = _super.call(this, response.statusText) || this;
            _this.response = response;
            return _this;
        }
        return HTTPError;
    }(Error));
    cmis.HTTPError = HTTPError;
    var CmisSession = (function () {
        function CmisSession(url) {
            this.options = { succinct: true };
            this.url = url;
        }
        CmisSession.prototype.setProperties = function (options, properties) {
            var i = 0;
            for (var id in properties) {
                options['propertyId[' + i + ']'] = id;
                var propertyValue = properties[id];
                if (propertyValue !== null && propertyValue !== undefined) {
                    if (Object.prototype.toString.apply(propertyValue) == '[object Array]') {
                        var multiProperty = propertyValue;
                        for (var j = 0; j < multiProperty.length; j++) {
                            options['propertyValue[' + i + '][' + j + ']'] = multiProperty[j];
                        }
                    }
                    else {
                        options['propertyValue[' + i + ']'] = propertyValue;
                    }
                }
                i++;
            }
        };
        CmisSession.prototype.setPolicies = function (options, policies) {
            for (var i = 0; i < policies.length; i++) {
                options['policy[' + i + ']'] = policies[i];
            }
        };
        ;
        CmisSession.prototype.setACEs = function (options, ACEs, action) {
            var i = 0;
            for (var id in ACEs) {
                options[action + 'ACEPrincipal[' + i + ']'] = id;
                var ace = ACEs[id];
                for (var j = 0; j < ace.length; j++) {
                    options[action + 'ACEPermission[' + i + '][' + j + ']'] = ACEs[id][j];
                }
                i++;
            }
        };
        ;
        CmisSession.prototype.setSecondaryTypeIds = function (options, secondaryTypeIds, action) {
            for (var i = 0; i < secondaryTypeIds.length; i++) {
                options[action + 'SecondaryTypeId[' + i + ']'] = secondaryTypeIds[i];
            }
        };
        ;
        CmisSession.prototype.http = function (method, url, options, multipartData) {
            var _this = this;
            var body = {};
            for (var k in this.options) {
                if (this.options[k] != null && this.options[k] !== undefined) {
                    body[k] = this.options[k];
                }
            }
            for (var k in options) {
                if (options[k] != null && options[k] !== undefined) {
                    body[k] = options[k];
                }
            }
            var auth;
            if (this.username && this.password) {
                auth = 'Basic ' + isomorphic_base64_1.btoa(this.username + ":" + this.password);
            }
            else if (this.token) {
                auth = "Bearer " + this.token;
            }
            var cfg = { method: method };
            if (auth) {
                cfg.headers = {
                    'Authorization': auth
                };
            }
            else {
                cfg.credentials = 'include';
            }
            if (multipartData) {
                var formData = new FormData();
                var content = multipartData.content;
                if ('string' == typeof content) {
                    if (typeof (Blob) !== 'undefined')
                        content = new Blob([content]);
                }
                else if (typeof (Buffer) !== 'undefined') {
                    content = new Buffer(content);
                }
                formData.append('content', content, multipartData.mimeTypeExtension ? multipartData.filename + '.' + multipartData.mimeTypeExtension : multipartData.filename);
                for (var k in body) {
                    formData.append(k, '' + body[k]);
                }
                if (this.charset) {
                    formData.append('_charset_', this.charset);
                }
                cfg.body = formData;
            }
            else {
                var usp = new URLSearchParams();
                for (var k in body) {
                    usp.set(k, body[k]);
                }
                if (method !== 'GET') {
                    cfg.body = usp.toString();
                    cfg.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
                }
                else {
                    url = url + "?" + usp.toString();
                }
            }
            var response = fetch(url, cfg).then(function (res) {
                if (res.status < 200 || res.status > 299) {
                    throw new HTTPError(res);
                }
                return res;
            });
            if (this.errorHandler) {
                response.catch(function (err) { return _this.errorHandler(err); });
            }
            return response;
        };
        ;
        CmisSession.prototype.get = function (url, options) {
            return this.http('GET', url, options);
        };
        CmisSession.prototype.post = function (url, options, multipartData) {
            return this.http('POST', url, options, multipartData);
        };
        CmisSession.prototype.setToken = function (token) {
            this.token = token;
            return this;
        };
        CmisSession.prototype.setCredentials = function (username, password) {
            this.username = username;
            this.password = password;
            return this;
        };
        CmisSession.prototype.setCharset = function (charset) {
            this.charset = charset;
            return this;
        };
        CmisSession.prototype.setErrorHandler = function (handler) {
            this.errorHandler = handler;
        };
        CmisSession.prototype.loadRepositories = function () {
            var _this = this;
            return this.get(this.url, this.options).then(function (res) {
                return res.json().then(function (data) {
                    for (var repo in data) {
                        _this.defaultRepository = data[repo];
                        break;
                    }
                    _this.repositories = data;
                    return;
                });
            });
        };
        CmisSession.prototype.getRepositoryInfo = function () {
            return this.get(this.defaultRepository.repositoryUrl, { cmisselector: 'repositoryInfo' })
                .then(function (res) { return res.json(); });
        };
        CmisSession.prototype.getTypeChildren = function (typeId, includePropertyDefinitions, options) {
            if (options === void 0) { options = {}; }
            var o = options;
            o.cmisselector = 'typeChildren';
            o.typeId = typeId;
            o.includePropertyDefinitions = includePropertyDefinitions;
            return this.get(this.defaultRepository.repositoryUrl, o).then(function (res) { return res.json(); });
        };
        CmisSession.prototype.getTypeDescendants = function (typeId, depth, includePropertyDefinitions) {
            return this.get(this.defaultRepository.repositoryUrl, {
                cmisselector: 'typeDescendants',
                typeId: typeId,
                includePropertyDefinitions: includePropertyDefinitions,
                depth: depth
            }).then(function (res) { return res.json(); });
        };
        CmisSession.prototype.getTypeDefinition = function (typeId) {
            return this.get(this.defaultRepository.repositoryUrl, {
                cmisselector: 'typeDefinition',
                typeId: typeId,
            }).then(function (res) { return res.json(); });
        };
        CmisSession.prototype.getCheckedOutDocs = function (objectId, options) {
            if (options === void 0) { options = {}; }
            var o = options;
            o.cmisselector = 'checkedOut';
            return this.get(this.defaultRepository.repositoryUrl, o).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.query = function (statement, searchAllVersions, options) {
            if (searchAllVersions === void 0) { searchAllVersions = false; }
            if (options === void 0) { options = {}; }
            var o = options;
            o.cmisaction = 'query';
            o.statement = statement;
            o.searchAllVersions = searchAllVersions;
            return this.post(this.defaultRepository.repositoryUrl, o).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.createType = function (type) {
            return this.post(this.defaultRepository.repositoryUrl, {
                cmisaction: 'createType',
                type: JSON.stringify(type)
            }).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.updateType = function (type) {
            return this.post(this.defaultRepository.repositoryUrl, {
                cmisaction: 'updateType',
                type: JSON.stringify(type)
            }).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.deleteType = function (typeId) {
            return this.post(this.defaultRepository.repositoryUrl, {
                cmisaction: 'deleteType',
                typeId: JSON.stringify(typeId)
            }).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.getObjectByPath = function (path, options) {
            if (options === void 0) { options = {}; }
            var o = options;
            o.cmisselector = 'object';
            var sp = path.split('/');
            for (var i = sp.length - 1; i >= 0; i--) {
                sp[i] = encodeURIComponent(sp[i]);
            }
            return this.get(this.defaultRepository.rootFolderUrl + sp.join('/'), o).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.getObject = function (objectId, returnVersion, options) {
            if (options === void 0) { options = {}; }
            var o = options;
            o.cmisselector = 'object';
            o.objectId = objectId;
            o.returnVersion = returnVersion;
            return this.get(this.defaultRepository.rootFolderUrl, o).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.createFolder = function (parentId, name, type, policies, addACEs, removeACEs) {
            if (type === void 0) { type = 'cmis:folder'; }
            if (policies === void 0) { policies = []; }
            if (addACEs === void 0) { addACEs = {}; }
            if (removeACEs === void 0) { removeACEs = {}; }
            var options = new Options();
            options.objectId = parentId;
            options.repositoryId = this.defaultRepository.repositoryId;
            options.cmisaction = 'createFolder';
            var properties = {
                'cmis:name': name,
                'cmis:objectTypeId': type
            };
            this.setProperties(options, properties);
            this.setPolicies(options, policies);
            this.setACEs(options, addACEs, 'add');
            this.setACEs(options, removeACEs, 'remove');
            return this.post(this.defaultRepository.rootFolderUrl, options).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.getChildren = function (objectId, options) {
            if (options === void 0) { options = {}; }
            var o = options;
            o.cmisselector = 'children';
            o.objectId = objectId;
            return this.get(this.defaultRepository.rootFolderUrl, o).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.getDescendants = function (folderId, depth, options) {
            if (options === void 0) { options = {}; }
            var o = options;
            o.cmisselector = 'descendants';
            if (depth) {
                o.depth = depth;
            }
            o.objectId = folderId;
            return this.get(this.defaultRepository.rootFolderUrl, o).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.getFolderTree = function (folderId, depth, options) {
            if (options === void 0) { options = {}; }
            var o = options;
            o.cmisselector = 'folderTree';
            if (depth) {
                o.depth = depth;
            }
            o.objectId = folderId;
            return this.get(this.defaultRepository.rootFolderUrl, o).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.getFolderParent = function (folderId, options) {
            if (options === void 0) { options = {}; }
            var o = options;
            o.cmisselector = 'parent';
            o.objectId = folderId;
            return this.get(this.defaultRepository.rootFolderUrl, o).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.getParents = function (objectId, options) {
            if (options === void 0) { options = {}; }
            var o = options;
            o.cmisselector = 'parents';
            o.objectId = objectId;
            return this.get(this.defaultRepository.rootFolderUrl, o).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.getAllowableActions = function (objectId, options) {
            if (options === void 0) { options = {}; }
            var o = options;
            o.cmisselector = 'allowableActions';
            o.objectId = objectId;
            return this.get(this.defaultRepository.rootFolderUrl, o).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.getProperties = function (objectId, returnVersion, options) {
            if (options === void 0) { options = {}; }
            var o = options;
            o.cmisselector = 'properties';
            o.objectId = objectId;
            o.returnVersion = returnVersion;
            return this.get(this.defaultRepository.rootFolderUrl, o).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.updateProperties = function (objectId, properties, options) {
            if (options === void 0) { options = {}; }
            var o = options;
            o.objectId = objectId;
            o.cmisaction = 'update';
            this.setProperties(options, properties);
            return this.post(this.defaultRepository.rootFolderUrl, o).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.moveObject = function (objectId, sourceFolderId, targetFolderId, options) {
            if (options === void 0) { options = {}; }
            var o = options;
            o.objectId = objectId;
            o.cmisaction = 'move';
            o.targetFolderId = targetFolderId;
            o.sourceFolderId = sourceFolderId;
            return this.post(this.defaultRepository.rootFolderUrl, o).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.createDocument = function (parentId, content, input, mimeTypeExtension, versioningState, policies, addACEs, removeACEs, options) {
            if (options === void 0) { options = {}; }
            var o = options;
            if ('string' == typeof input) {
                input = {
                    'cmis:name': input
                };
            }
            var properties = input || {};
            if (!properties['cmis:objectTypeId']) {
                properties['cmis:objectTypeId'] = 'cmis:document';
            }
            if (versioningState) {
                o.versioningState = versioningState;
            }
            o.objectId = parentId;
            this.setProperties(o, properties);
            if (policies) {
                this.setPolicies(o, policies);
            }
            if (addACEs) {
                this.setACEs(o, addACEs, 'add');
            }
            if (removeACEs) {
                this.setACEs(o, removeACEs, 'remove');
            }
            o.repositoryId = this.defaultRepository.repositoryId;
            o.cmisaction = 'createDocument';
            return this.post(this.defaultRepository.rootFolderUrl, o, {
                content: content,
                filename: properties['cmis:name'],
                mimeTypeExtension: mimeTypeExtension
            }).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.bulkUpdateProperties = function (objectIds, properties, addSecondaryTypeIds, removeSecondaryTypeIds) {
            if (properties === void 0) { properties = {}; }
            if (addSecondaryTypeIds === void 0) { addSecondaryTypeIds = []; }
            if (removeSecondaryTypeIds === void 0) { removeSecondaryTypeIds = []; }
            var options = new Options();
            for (var i = objectIds.length - 1; i >= 0; i--) {
                options['objectId[' + i + ']'] = objectIds[i];
            }
            options.objectIds = objectIds;
            this.setProperties(options, properties);
            this.setSecondaryTypeIds(options, addSecondaryTypeIds, 'add');
            this.setSecondaryTypeIds(options, removeSecondaryTypeIds, 'remove');
            options.cmisaction = 'bulkUpdate';
            return this.post(this.defaultRepository.repositoryUrl, options).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.getContentStream = function (objectId, download, streamId) {
            if (download === void 0) { download = 'inline'; }
            var options = new Options();
            options.cmisselector = 'content';
            options.objectId = objectId;
            options.download = (!!download) ? 'attachment' : 'inline';
            return this.get(this.defaultRepository.rootFolderUrl, options);
        };
        ;
        CmisSession.prototype.createDocumentFromSource = function (parentId, sourceId, content, input, mimeTypeExtension, versioningState, policies, addACEs, removeACEs, options) {
            if (options === void 0) { options = {}; }
            var o = options;
            if ('string' == typeof input) {
                input = {
                    'cmis:name': input
                };
            }
            var properties = input || {};
            if (!properties['cmis:objectTypeId']) {
                properties['cmis:objectTypeId'] = 'cmis:document';
            }
            if (versioningState) {
                o.versioningState = versioningState;
            }
            o.objectId = parentId;
            this.setProperties(o, properties);
            if (policies) {
                this.setPolicies(o, policies);
            }
            if (addACEs) {
                this.setACEs(o, addACEs, 'add');
            }
            if (removeACEs) {
                this.setACEs(o, removeACEs, 'remove');
            }
            o.repositoryId = this.defaultRepository.repositoryId;
            o.sourceId = sourceId;
            o.cmisaction = 'createDocumentFromSource';
            var multipartData = null;
            if (content) {
                multipartData = {
                    content: content,
                    filename: properties['cmis:name'],
                    mimeTypeExtension: mimeTypeExtension
                };
            }
            return this.post(this.defaultRepository.rootFolderUrl, o, multipartData).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.getContentStreamURL = function (objectId, download, streamId) {
            if (download === void 0) { download = 'inline'; }
            var options = new Options();
            options.cmisselector = 'content';
            options.objectId = objectId;
            options.download = download;
            options.streamId = streamId;
            var usp = new URLSearchParams();
            for (var k in options) {
                if (options[k] != null && options[k] !== undefined) {
                    usp.append(k, options[k]);
                }
            }
            for (var k in this.options) {
                if (!usp.has(k) && this.options[k] != null && this.options[k] !== undefined) {
                    usp.append(k, this.options[k]);
                }
            }
            return this.defaultRepository.rootFolderUrl + "?" + usp.toString();
        };
        ;
        CmisSession.prototype.getRenditions = function (objectId, options) {
            if (options === void 0) { options = {
                renditionFilter: '*'
            }; }
            var o = options;
            o.cmisselector = 'renditions';
            o.objectId = objectId;
            return this.get(this.defaultRepository.rootFolderUrl, o).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.checkOut = function (objectId, options) {
            if (options === void 0) { options = {}; }
            var o = options;
            o.objectId = objectId;
            o.cmisaction = 'checkOut';
            return this.post(this.defaultRepository.rootFolderUrl, o).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.cancelCheckOut = function (objectId) {
            var options = new Options();
            options.objectId = objectId;
            options.cmisaction = 'cancelCheckOut';
            return this.post(this.defaultRepository.rootFolderUrl, options);
        };
        ;
        CmisSession.prototype.checkIn = function (objectId, major, input, content, mimeTypeExtension, comment, policies, addACEs, removeACEs, options) {
            if (major === void 0) { major = false; }
            if (options === void 0) { options = {}; }
            var o = options;
            if ('string' == typeof input) {
                input = {
                    'cmis:name': input
                };
            }
            var properties = input || {};
            if (comment) {
                o.checkinComment = comment;
            }
            o.major = major;
            o.objectId = objectId;
            this.setProperties(o, properties);
            if (policies) {
                this.setPolicies(o, policies);
            }
            if (addACEs) {
                this.setACEs(o, addACEs, 'add');
            }
            if (removeACEs) {
                this.setACEs(o, removeACEs, 'remove');
            }
            o.cmisaction = 'checkIn';
            return this.post(this.defaultRepository.rootFolderUrl, o, {
                content: content,
                mimeTypeExtension: mimeTypeExtension,
                filename: properties['cmis:name']
            }).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.getObjectOfLatestVersion = function (versionSeriesId, options) {
            if (options === void 0) { options = { major: false }; }
            var o = options;
            o.cmisselector = 'object';
            o.objectId = versionSeriesId;
            o.versionSeriesId = versionSeriesId;
            o.major = options.major;
            return this.get(this.defaultRepository.rootFolderUrl, o).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.setContentStream = function (objectId, content, overwriteFlag, filename, options) {
            if (overwriteFlag === void 0) { overwriteFlag = false; }
            if (options === void 0) { options = {}; }
            var o = options;
            o.objectId = objectId;
            o.overwriteFlag = overwriteFlag;
            o.cmisaction = 'setContent';
            return this.post(this.defaultRepository.rootFolderUrl, o, {
                content: content,
                filename: filename
            }).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.appendContentStream = function (objectId, content, isLastChunk, filename, options) {
            if (isLastChunk === void 0) { isLastChunk = false; }
            if (options === void 0) { options = {}; }
            var o = options;
            o.objectId = objectId;
            o.cmisaction = 'appendContent';
            o.isLastChunk = isLastChunk;
            return this.post(this.defaultRepository.rootFolderUrl, o, {
                content: content,
                filename: filename
            }).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.deleteContentStream = function (objectId, options) {
            if (options === void 0) { options = {}; }
            var o = options;
            o.objectId = objectId;
            o.cmisaction = 'deleteContent';
            return this.post(this.defaultRepository.rootFolderUrl, o);
        };
        ;
        CmisSession.prototype.getAllVersions = function (versionSeriesId, options) {
            if (options === void 0) { options = {}; }
            var o = options;
            o.versionSeriesId = versionSeriesId;
            o.cmisselector = 'versions';
            return this.get(this.defaultRepository.rootFolderUrl, o);
        };
        ;
        CmisSession.prototype.getAppliedPolicies = function (objectId, options) {
            if (options === void 0) { options = {}; }
            var o = options;
            o.objectId = objectId;
            o.cmisselector = 'policies';
            return this.get(this.defaultRepository.rootFolderUrl, o).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.getACL = function (objectId, onlyBasicPermissions) {
            if (onlyBasicPermissions === void 0) { onlyBasicPermissions = false; }
            var options = new Options();
            options.objectId = objectId;
            options.onlyBasicPermissions = onlyBasicPermissions;
            options.cmisselector = 'acl';
            return this.get(this.defaultRepository.rootFolderUrl, options).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.deleteObject = function (objectId, allVersions) {
            if (allVersions === void 0) { allVersions = false; }
            var options = new Options();
            options.repositoryId = this.defaultRepository.repositoryId;
            options.cmisaction = 'delete';
            options.objectId = objectId;
            options.allVersions = allVersions;
            return this.post(this.defaultRepository.rootFolderUrl, options);
        };
        ;
        CmisSession.prototype.deleteTree = function (objectId, allVersions, unfileObjects, continueOnFailure) {
            if (allVersions === void 0) { allVersions = false; }
            if (continueOnFailure === void 0) { continueOnFailure = false; }
            var options = new Options();
            options.repositoryId = this.defaultRepository.repositoryId;
            options.cmisaction = 'deleteTree';
            options.objectId = objectId;
            options.allVersions = !!allVersions;
            if (unfileObjects) {
                options.unfileObjects = unfileObjects;
            }
            options.continueOnFailure = continueOnFailure;
            return this.post(this.defaultRepository.rootFolderUrl, options);
        };
        ;
        CmisSession.prototype.getContentChanges = function (changeLogToken, includeProperties, includePolicyIds, includeACL, options) {
            if (includeProperties === void 0) { includeProperties = false; }
            if (includePolicyIds === void 0) { includePolicyIds = false; }
            if (includeACL === void 0) { includeACL = false; }
            if (options === void 0) { options = {}; }
            var o = options;
            o.cmisselector = 'contentChanges';
            if (changeLogToken) {
                o.changeLogToken = changeLogToken;
            }
            o.includeProperties = includeProperties;
            o.includePolicyIds = includePolicyIds;
            o.includeACL = includeACL;
            return this.get(this.defaultRepository.repositoryUrl, o).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.createRelationship = function (properties, policies, addACEs, removeACEs, options) {
            if (options === void 0) { options = {}; }
            var o = options;
            this.setProperties(o, properties);
            if (policies) {
                this.setPolicies(o, policies);
            }
            if (addACEs) {
                this.setACEs(o, addACEs, 'add');
            }
            if (removeACEs) {
                this.setACEs(o, removeACEs, 'remove');
            }
            o.cmisaction = 'createRelationship';
            return this.post(this.defaultRepository.repositoryUrl, o).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.createPolicy = function (folderId, properties, policies, addACEs, removeACEs, options) {
            if (options === void 0) { options = {}; }
            var o = options;
            o.objectId = folderId;
            this.setProperties(o, properties);
            if (policies) {
                this.setPolicies(o, policies);
            }
            if (addACEs) {
                this.setACEs(o, addACEs, 'add');
            }
            if (removeACEs) {
                this.setACEs(o, removeACEs, 'remove');
            }
            o.cmisaction = 'createPolicy';
            return this.post(this.defaultRepository.repositoryUrl, o).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.createItem = function (folderId, properties, policies, addACEs, removeACEs, options) {
            if (options === void 0) { options = {}; }
            var o = options;
            o.objectId = folderId;
            this.setProperties(o, properties);
            if (policies) {
                this.setPolicies(o, policies);
            }
            if (addACEs) {
                this.setACEs(o, addACEs, 'add');
            }
            if (removeACEs) {
                this.setACEs(o, removeACEs, 'remove');
            }
            o.cmisaction = 'createItem';
            return this.post(this.defaultRepository.repositoryUrl, o).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.getLastResult = function () {
            return this.post(this.defaultRepository.repositoryUrl, { cmisaction: 'lastResult' }).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.addObjectToFolder = function (objectId, folderId, allVersions, options) {
            if (allVersions === void 0) { allVersions = false; }
            if (options === void 0) { options = {}; }
            var o = options;
            o.objectId = objectId;
            o.cmisaction = 'addObjectToFolder';
            o.allVersions = allVersions;
            o.folderId = folderId;
            return this.post(this.defaultRepository.rootFolderUrl, o).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.removeObjectFromFolder = function (objectId, folderId, options) {
            if (options === void 0) { options = {}; }
            var o = options;
            o.objectId = objectId;
            o.cmisaction = 'removeObjectFromFolder';
            o.folderId = folderId;
            return this.post(this.defaultRepository.rootFolderUrl, o).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.getObjectRelationships = function (objectId, includeSubRelationshipTypes, relationshipDirection, typeId, options) {
            if (includeSubRelationshipTypes === void 0) { includeSubRelationshipTypes = false; }
            if (options === void 0) { options = {}; }
            var o = options;
            o.objectId = objectId;
            o.includeSubRelationshipTypes = includeSubRelationshipTypes;
            o.relationshipDirection = relationshipDirection || 'either';
            if (typeId) {
                o.typeId = typeId;
            }
            o.cmisselector = 'relationships';
            return this.get(this.defaultRepository.rootFolderUrl, o).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.applyPolicy = function (objectId, policyId, options) {
            if (options === void 0) { options = {}; }
            var o = options;
            o.objectId = objectId;
            o.policyId = policyId;
            o.cmisaction = 'applyPolicy';
            return this.post(this.defaultRepository.rootFolderUrl, o).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.removePolicy = function (objectId, policyId, options) {
            if (options === void 0) { options = {}; }
            var o = options;
            o.objectId = objectId;
            o.policyId = policyId;
            o.cmisaction = 'removePolicy';
            return this.post(this.defaultRepository.rootFolderUrl, o).then(function (res) { return res.json(); });
        };
        ;
        CmisSession.prototype.applyACL = function (objectId, addACEs, removeACEs, propagation) {
            var options = new Options();
            options.objectId = objectId;
            options.cmisaction = 'applyACL';
            options.propagation = propagation;
            if (addACEs) {
                this.setACEs(options, addACEs, 'add');
            }
            if (removeACEs) {
                this.setACEs(options, removeACEs, 'remove');
            }
            return this.post(this.defaultRepository.rootFolderUrl, options).then(function (res) { return res.json(); });
        };
        ;
        return CmisSession;
    }());
    cmis.CmisSession = CmisSession;
})(cmis = exports.cmis || (exports.cmis = {}));
//# sourceMappingURL=cmis.js.map