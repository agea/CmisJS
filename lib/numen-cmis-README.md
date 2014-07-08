numen.cmis
==========

**numen.cmis** is an **AngularJS** ([https://angularjs.org](https://angularjs.org)) module with a service encapsulating **CmisJS** ([https://www.npmjs.org/package/cmis](https://www.npmjs.org/package/cmis)), the CMIS JavaScript library.

The objectives are:

- Ease the use of **CmisJS** in an AngularJS application
- Handle all asynchronous calls (and associated errors) with AngularJS promises

## Installation

Load the JavaScript files:

    <script src="lib/cmis/cmis.0.1.6.min-all.js"></script>
    <script src="lib/cmis/numen-cmis.min.js"></script>

Load the **numen.cmis** module:

    angular.module('TestCmisJS', [
            'ngRoute',
            …
            'numen.cmis',
            …
        ])

## Use

The service is called **CmisManagerFactory** (located in the **numen.cmis** module).

This service is actually a function with the two following parameters:

1. *url* : URL of the "Browser Binding" service endpoint
2. *options* : object with the following (optional) keys:
    - *username* and *password* : in case of login/password authentication
    - *token* : in case of token authentication
    - *repositoryId* : identifier of the current repository (if missing, the current repository is arbitrarily chosen from the list of repositories)
    - *errorCallback* : general callback function (called in case of failure of a CMIS operation)

It returns an object called ***cmisManager*** hereafter. CMIS operations are performed by calling methods on this object.

Typically, you create an applicative AngularJS service that will be the result of calling this function, as in the following example:

    .factory('MyCmisManager', ['CmisManagerFactory', 'ExceptionManager', function(CmisManagerFactory, ExceptionManager) {
        var errorCallback = function(response) {
            var title = 'CMIS request error';
            var message = 'Response: ' + angular.toJson(response);
            ExceptionManager.setException(title, message);
        };
        return CmisManagerFactory("http://localhost:8080/myCmisServer/cmis/browser",
            {
                username : "test",
                password : "aaa",
                //token : "7654321",
                repositoryId : "rep1",
                errorCallback : errorCallback
            }
        );
    }])


The following methods can be used to change the authentication parameters:

- ***cmisManager***.setCredentials( *username*, *password* )
- ***cmisManager***.setToken( *token* )

The following method connects to the CMIS server. It must be called after setting the authentication parameters (via the *options* parameter of the **CmisManagerFactory** or via the *setCredentials* or *setToken* methods):

- ***cmisManager***.connect()

The following methods can be used to get the list of available repositories and to change the current repository (they return AngularJS promises):

- ***cmisManager***.getRepositories()
- ***cmisManager***.setCurrentRepository( *repositoryId* )

Finally, 49 of 54 **CmisJS** methods (see [http://agea.github.io/CmisJS/docs/#!/api/CmisSession](http://agea.github.io/CmisJS/docs/#!/api/CmisSession)) are available on the ***cmisManager*** object.
They have the same names and parameters, but they all return an AngularJS promise (instead of a **CmisRequest** object, usually).
The result of the promise (value or reason) is exactly the result returned by the native **CmisJS** call.

The 5 **CmisJS** methods unavailable on the ***cmisManager*** object are:

- setCredentials( *username*, *password* ) : **CmisSession** => directly managed by the AngularJS service
- setToken( *token* ) : **CmisSession** => directly managed by the AngularJS service
- setGlobalHandlers( *notOk*, *error* ) : **CmisSession** => directly managed by the AngularJS service
- loadRepositories() : **CmisRequest** => directly managed by the AngularJS service
- pipeContentStream( *objectId*, *options* ) => only for Node.js


##License

MIT license - [http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php)
