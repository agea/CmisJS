// Uses AMD or browser globals to create a module.

// Grabbed from https://github.com/umdjs/umd/blob/master/amdWeb.js.
// Check out https://github.com/umdjs/umd for more patterns.

// Defines a module "cmis".
// Note that the name of the module is implied by the file name. It is best
// if the file name and the exported global have matching names.

// If you do not want to support the browser global path, then you
// can remove the `root` use and the passing `this` as the first arg to
// the top function.

(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else {
        // Browser globals
        root.cmis = factory();
    }
}(this, function () {
    'use strict';

    var pub = {};
    var priv = {};

    /**
     * Connects to a cmis repository with provided credentials
     *
     * @param {String} url 
     * @param {String} username 
     * @param {String} password
     * @return {Request}
     * @api public
     */
    pub.connect = function(url, username, password){
        priv.url = url;
        priv.username = username;
        priv.password = password;
        return request.get(url).auth(username, password);
    }


    // Return a value to define the module export.
    // This example returns a functions, but the module
    // can return an object as the exported value.
    return pub;
}));
