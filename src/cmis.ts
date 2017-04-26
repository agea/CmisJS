import 'isomorphic-fetch';
import { URLSearchParams } from 'urlsearchparams';
import { btoa } from 'isomorphic-base64';

export namespace cmis {

  export class Options {
    succinct?: boolean = true;
    token?: string;
    typeId?: string;
    includePropertyDefinitions?: boolean;
    depth?: number;
    filter?: string;
    maxItems?: number;
    skipCount?: number;
    orderBy?: string;
    renditionFilter?: string;
    includeAllowableActions?: boolean;
    includeRelationships?: boolean;
    statement?: string;
    searchAllVersions?: boolean;
    type?: string;
    cmisaction?: 'query' |
    'createType' |
    'updateType' |
    'deleteType';
    cmisselector?:
    'repositoryInfo' |
    'typeChildren' |
    'typeDescendants' |
    'typeDefinition' |
    'checkedOut'|
    'object';
  };


  /**
   * An error wrapper to handle response in Promise.catch()
   * 
   * @export
   * @class HTTPError
   * @extends {Error}
   */
  export class HTTPError extends Error {
    public readonly response: Response;
    constructor(response: Response) {
      super(response.statusText);
      this.response = response;
    }
  }


  /**
   * The session is the enrty point for all cmis requests
   * 
   * example usage:
   * 
   *      // typescript/es6
   *      let session = new cmis.CmisSession('http://localhost:18080/alfresco/cmisbrowser');
   *      session.setCredentials(username, password).loadRepositories()
   *          .then(()=> session.query("select * from cmis:document"))
   *          .then(data => console.log(data));
   * 
   *      // javascript/es5
   *      var session = new cmis.CmisSession('http://localhost:18080/alfresco/cmisbrowser');
   *      session.setCredentials(username, password).loadRepositories().then(function(){
   *            return session.query("select * from cmis:document"));
   *      }).then(function(data) {console.log(data);});
   * 
   * @export
   * @class CmisSession
   */
  export class CmisSession {

    private url: string;
    private token: string;
    private username: string;
    private errorHandler: (err: Error) => void;
    private password: string;
    private options: Options = new Options();
    public defaultRepository: any;
    public repositories: Array<any>;

    /**
     * internal method to perform http requests
     * 
     * @private
     * @param {('GET' | 'POST')} method 
     * @param {String} url 
     * @param {Options} [options] 
     * @returns {Promise<Response>} 
     * 
     * @memberOf CmisSession
     */
    private http(method: 'GET' | 'POST', url: String, options?: Options): Promise<Response> {
      let usp = new URLSearchParams();

      for (let k in options) {
        if (options[k] != null && options[k] !== undefined) {
          usp.append(k, options[k]);
        }
      }

      for (let k in this.options) {
        if (!usp.has(k) && this.options[k] != null && this.options[k] !== undefined) {
          usp.append(k, this.options[k]);
        }
      }

      let auth;

      if (this.username && this.password) {
        auth = 'Basic ' + btoa(`${this.username}:${this.password}`);
      } else if (this.token) {
        auth = `Bearer ${this.token}`;
      }

      let response = fetch(`${url}?${usp.toString()}`, {
        method: method,
        headers: {
          'Authorization': auth
        }
      }).then(res => {
        if (res.status < 200 || res.status > 299) {
          throw new HTTPError(res);
        }
        return res;
      });

      if (this.errorHandler) {
        response.catch(this.errorHandler);
      }

      return response;
    };


    /**
     * shorthand for http.('GET',...)
     * 
     * @private
     * @param {String} url 
     * @param {Options} [options] 
     * @returns {Promise<Response>} 
     * 
     * @memberOf CmisSession
     */
    private get(url: String, options?: Options): Promise<Response> {
      return this.http('GET', url, options);
    }


    /**
     * shorthand for http.('POST',...)
     * 
     * @private
     * @param {String} url 
     * @param {Options} [options] 
     * @returns {Promise<Response>} 
     * 
     * @memberOf CmisSession
     */
    private post(url: String, options?: Options): Promise<Response> {
      return this.http('POST', url, options);
    }


    /**
     * Creates an instance of CmisSession.
     * @param {string} url 
     * 
     * @memberOf CmisSession
     */
    constructor(url: string) {
      this.url = url;
    }


    /**
     * sets token for authentication
     * 
     * @param {string} token 
     * @returns {CmisSession} 
     * 
     * @memberOf CmisSession
     */
    public setToken(token: string): CmisSession {
      this.options.token = token;
      return this;
    }


    /**
     * sets credentials for authentication
     * 
     * @param {string} username 
     * @param {string} password 
     * @returns {CmisSession} 
     * 
     * @memberOf CmisSession
     */
    public setCredentials(username: string, password: string): CmisSession {
      this.username = username;
      this.password = password;
      return this;
    }


    /**
     * sets global error handler
     * 
     * @param {(err: Error) => void} handler 
     * 
     * @memberOf CmisSession
     */
    public setErrorHandler(handler: (err: Error) => void): void {
      this.errorHandler = handler;
    }


    /**
     * Connects to a cmis server and retrieves repositories,
     * token or credentils must already be set
     * 
     * @returns {Promise<void>} 
     * 
     * @memberOf CmisSession
     */
    public loadRepositories(): Promise<void> {
      return this.get(this.url, this.options).then(res => {
        return res.json().then(data => {
          for (let repo in data) {
            this.defaultRepository = data[repo];
            break;
          }
          this.repositories = data;
          return;
        });
      });
    }


    /**
     * gets repository informations
     * 
     * @returns {Promise<any>} 
     * 
     * @memberOf CmisSession
     */
    public getRepositoryInfo(): Promise<any> {
      return this.get(this.defaultRepository.repositoryUrl, { cmisselector: 'repositoryInfo' })
        .then(res => res.json());
    }


    /**
     * gets the types that are immediate children
     * of the specified typeId, or the base types if no typeId is provided
     * 
     * @param {string} [typeId] 
     * @param {boolean} [includePropertyDefinitions] 
     * @returns {Promise<any>} 
     * 
     * @memberOf CmisSession
     */
    public getTypeChildren(typeId?: string, includePropertyDefinitions?: boolean): Promise<any> {
      return this.get(this.defaultRepository.repositoryUrl, {
        cmisselector: 'typeChildren',
        typeId: typeId,
        includePropertyDefinitions: includePropertyDefinitions
      }).then(res => res.json());
    }


    /**
     * gets all types descended from the specified typeId, or all the types
     * in the repository if no typeId is provided
     * 
     * @param {string} [typeId] 
     * @param {number} [depth] 
     * @param {boolean} [includePropertyDefinitions] 
     * @returns {Promise<any>} 
     * 
     * @memberOf CmisSession
     */
    public getTypeDescendants(typeId?: string, depth?: number, includePropertyDefinitions?: boolean): Promise<any> {
      return this.get(this.defaultRepository.repositoryUrl, {
        cmisselector: 'typeDescendants',
        typeId: typeId,
        includePropertyDefinitions: includePropertyDefinitions,
        depth: depth
      }).then(res => res.json());

    }


    /**
     * gets definition of the specified type
     * 
     * @param {string} typeId 
     * @returns {Promise<any>} 
     * 
     * @memberOf CmisSession
     */
    public getTypeDefinition(typeId: string): Promise<any> {
      return this.get(this.defaultRepository.repositoryUrl, {
        cmisselector: 'typeDefinition',
        typeId: typeId,
      }).then(res => res.json());
    }

    /**
    * gets the documents that have been checked out in the repository
    * @param {string} objectId
    * @param {Options} options (possible options: filter, maxItems, skipCount, orderBy, renditionFilter, includeAllowableActions, includeRelationships, succinct)
    * @return {Promise<any>}
    */
    public getCheckedOutDocs(objectId?: string, options: Options = new Options()): Promise<any> {
      options.cmisselector = 'checkedOut'
      return this.get(this.defaultRepository.repositoryUrl, options).then(res => res.json());
    };

    /**
    * performs a cmis query against the repository
    * @param {String} statement
    * @param {Boolean} searchAllVersions
    * @param {Options} options (possible options: maxItems, skipCount, orderBy, renditionFilter, includeAllowableActions, includeRelationships, succinct)
    * @return {Promise<any>}
    */
    public query(statement: string, searchAllVersions: boolean = false, options: Options = new Options()): Promise<any> {
      options.cmisaction = 'query';
      options.statement = statement;
      options.searchAllVersions = searchAllVersions;
      return this.post(this.defaultRepository.repositoryUrl, options).then(res => res.json());
    };

    /**
     * Creates a new type definition
     * @param {any} type
     * @return {Promise<any>}
     *
     */
    public createType(type: any): Promise<any> {
      return this.post(this.defaultRepository.repositoryUrl, {
        cmisaction: 'createType',
        type: JSON.stringify(type)
      }).then(res => res.json());
    };

    /**
     * Updates a type definition
     * @param {any} type
     * @return {Promise<any>}
     *
     */
    public updateType(type: any): Promise<any> {
      return this.post(this.defaultRepository.repositoryUrl, {
        cmisaction: 'updateType',
        type: JSON.stringify(type)
      }).then(res => res.json());
    };

    /**
     * Deletes a type definition
     * @param {string} type
     * @return {Promise<any>}
     *
     */
    public deleteType(typeId: string): Promise<any> {
      return this.post(this.defaultRepository.repositoryUrl, {
        cmisaction: 'deleteType',
        typeId: JSON.stringify(typeId)
      }).then(res => res.json());
    };

    /**
     * gets an object by path
     *
     * @param {String} path
     * @param {Object} options
     * @return {CmisRequest}
     */
    public getObjectByPath(path:string, options:Options = new Options()):Promise<any> {
      options.cmisselector = 'object';
      var sp = path.split('/');
      for (var i = sp.length - 1; i >= 0; i--) {
        sp[i] = encodeURIComponent(sp[i]);
      }
      return this.get(this.defaultRepository.rootFolderUrl + sp.join('/'),options).then(res => res.json());
    };

  }
}
