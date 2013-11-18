//     CmisJS 
//     http://github.com/agea/CmisJS
//     (c) 2013 Andrea Agili
//     CmisJS may be freely distributed under the Apache 2.0 license.

(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else {
        root.cmis = factory();
    }
}(this, function () {
    'use strict';

//Public API
//----
    var cmis = {};

    // `connect` Connects to a cmis repository with provided credentials
    //
    //      @param url (or path if running in the browser) {String} 
    //      @param username {String}  
    //      @param password {String} 
    //      @return request {Request}
    
    cmis.connect = function (url, username, password) {
        _url = url;
        _username = username;
        _password = password;
        var r = _get(url).ok(function (res) {
                for (var repo in res.body) {
                    cmis.repo = res.body[repo];
                }
                if (_afterlogin !== undefined) {
                    _afterlogin(res);
                }
            });
        r.ok = function (callback) {
            _afterlogin = callback;
            return r;
        };
        return r.send();
    };


    // `setGlobalHandlers` sets sets global handlers for non ok and error responses
    //
    //      @param nonOk {Function}
    //      @param error {Function}

    cmis.setGlobalHandlers = function(nonOk, error){
        _globalNonOk = nonOk || _noop;
        _globalError = error || _noop;
    };

    // `getObject` gets an object by cmis:objectId
    //
    //      @param objectId {String}  
    //      @param options {Object}  
    //      @return request {Request}

    cmis.getObject = function (objectId, options){
        options = _fill(options);
        options.cmisselector = 'object';
        options.objectId = objectId;
        return _get(cmis.repo.rootFolderUrl).query(options).send();
    };


    // `getObjectByPath` gets an object by its path
    //
    //      @param path {String}  
    //      @param options {Object}  
    //      @return request {Request}

    cmis.getObjectByPath = function (path, options){
        options = _fill(options);
        options.cmisselector = 'object';
        
        return _get(cmis.repo.rootFolderUrl + path).query(options).send();
    };



    // if running on node.js require superagent 
    if (typeof module !== 'undefined' && module.exports) {
        var request = require('superagent');
    } 

    // `ok` sets callback when response status == 200
    //
    //      @param callback {Function}
    //      @return request {Request}

    request.Request.prototype.ok = function(callback) {
        this._callback_ok = callback || _noop;
        return this;
    };

    // `notOk` sets callback when response status != 200
    //
    //      @param callback {Function}
    //      @return request {Request}

    request.Request.prototype.notOk = function(callback) {
        this._callback_notOk = callback || _noop;
        return this;
    };

    //  `error` sets callback when response is in error
    //  (network, parsing errors etc..)
    //
    //      @param callback {Function}
    //      @return request {Request}

    request.Request.prototype.error = function(callback) {
        this._callback_error = callback || _noop;
        return this;
    };

    //Private members and methods
    //----
    var _url = null;
    var _username = null;
    var _password = null;
    var _afterlogin = undefined;

    var _noop = function(){};

    var _globalNonOk = _noop;
    var _globalError = _noop;


    request.Request.prototype.send = function() {
        var r = this;
        this.end(function(err, res){
            if (err){
                r._callback_error(err, res);
            } else {
                if (res.ok) {
                    r._callback_ok(res);
                } else {
                    r._callback_notOk(res);
                }                    
            }
        });
        return this;
    };

    var _http = function(method, url){
        var r = request(method,url);
        
        r._callback_ok = _noop;
        r._callback_notOk = _globalNonOk;
        r._callback_error = _globalError;

        return r.auth(_username, _password)
    };


    var _get = function(url){
        return _http('GET',url);
    }
    var _post = function(url){
        return _http('POST',url);
    }

    var _defaultOptions = {succinct:true};

    var _fill = function (options) {
        var o = {};
        for (var k in _defaultOptions) {
            o[k] = _defaultOptions[k];
        }
        if (options === undefined) {
            return o;
        }
        for (var k in options) {
            o[k] = options[k];
        }
        return o;
    };

    return cmis;
}));
