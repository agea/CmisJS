import 'isomorphic-fetch';
import { URLSearchParams } from 'urlsearchparams';
import { btoa } from 'isomorphic-base64';

export namespace cmis {

  export class QueryOptions {

    succinct?: boolean = true;

    //pageOptions
    maxItems?: number;
    skipCount?: number;
    orderBy?: string;

    //objectOptions
    filter?: string;
    renditionFilter?: string;
    includeAllowableActions?: boolean;
    includeRelationships?: boolean;

    includeACL?: boolean;
    includePolicyId?: boolean;

  }

  class Options extends QueryOptions {
    token?: string;
    typeId?: string;
    includePropertyDefinitions?: boolean;
    depth?: number;
    statement?: string;
    searchAllVersions?: boolean;
    type?: string;
    objectId?: string;
    returnVersion?: 'this' | 'latest' | 'latestmajor';
    repositoryId?: string;
    cmisaction?: 'query' |
    'createType' |
    'updateType' |
    'deleteType' |
    'createFolder';
    cmisselector?:
    'repositoryInfo' |
    'typeChildren' |
    'typeDescendants' |
    'typeDefinition' |
    'checkedOut' |
    'object' |
    'children' |
    'descendants' |
    'folderTree' |
    'parent' |
    'parents' |
    'allowableActions' |
    'properties';
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
     * format properties for requests
     * 
     * @private
     * @param {Options} options 
     * @param {({[k:string]:string|Array<string>})} properties 
     * 
     * @memberOf CmisSession
     */
    private setProperties(options: Options, properties: { [k: string]: string | Array<string> }) {
      var i = 0;
      for (var id in properties) {
        options['propertyId[' + i + ']'] = id;
        var propertyValue = properties[id];
        if (propertyValue !== null && propertyValue !== undefined) {
          if (Object.prototype.toString.apply(propertyValue) == '[object Array]') {
            for (var j = 0; j < propertyValue.length; j++) {
              options['propertyValue[' + i + '][' + j + ']'] = propertyValue[j];
            }
          } else {
            options['propertyValue[' + i + ']'] = propertyValue;
          }
        }
        i++;
      }
    }

    /**
     * format policies for requests
     * 
     * @private
     * @param {Options} options 
     * @param {Array<string>} policies 
     * 
     * @memberOf CmisSession
     */
    private setPolicies(options: Options, policies: Array<string>) {
      for (let i = 0; i < policies.length; i++) {
        options['policy[' + i + ']'] = policies[i];
      }
    };

    /**
     * format ACEs for requests
     * 
     * @private
     * @param {Options} options 
     * @param {{[k:string]:string}} ACEs 
     * @param {('add'|'remove')} action 
     * 
     * @memberOf CmisSession
     */
    private setACEs(options: Options, ACEs: { [k: string]: string }, action: 'add' | 'remove') {
      let i = 0;
      for (let id in ACEs) {
        options[action + 'ACEPrincipal[' + i + ']'] = id;
        let ace = ACEs[id];
        for (let j = 0; j < ace.length; j++) {
          options[action + 'ACEPermission[' + i + '][' + j + ']'] = ACEs[id][j];
        }
        i++;
      }
    };

    /**
     * format secondaryTypeIds for requests
     * 
     * @private
     * @param {Options} options 
     * @param {Array<string>} secondaryTypeIds 
     * @param {('add'|'remove')} action 
     * 
     * @memberOf CmisSession
     */
    private setSecondaryTypeIds(options: Options, secondaryTypeIds: Array<string>, action: 'add' | 'remove') {
      for (let i = 0; i < secondaryTypeIds.length; i++) {
        options[action + 'SecondaryTypeId[' + i + ']'] = secondaryTypeIds[i];
      }
    };

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

      let auth: string;

      if (this.username && this.password) {
        auth = 'Basic ' + btoa(`${this.username}:${this.password}`);
      } else if (this.token) {
        auth = `Bearer ${this.token}`;
      }

      let cfg: RequestInit = { method: method };
      if (auth) {
        cfg.headers = {
          'Authorization': auth
        };
      } else {
        cfg.credentials = 'include';
      }

      let response = fetch(`${url}?${usp.toString()}`, cfg).then(res => {
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
     * 
     * @param {string} [objectId] 
     * @param {QueryOptions} [queryOptions={}] 
     * @returns {Promise<any>} 
     * 
     * @memberOf CmisSession
     */
    public getCheckedOutDocs(objectId?: string, queryOptions: QueryOptions = {}): Promise<any> {
      let options = queryOptions as Options;
      options.cmisselector = 'checkedOut'
      return this.get(this.defaultRepository.repositoryUrl, options).then(res => res.json());
    };

    /**
    * performs a cmis query against the repository
    * @param {string} statement 
    * @param {boolean} [searchAllVersions=false] 
    * @param {QueryOptions} [queryOptions={}] 
    * @returns {Promise<any>} 
    * 
    * @memberOf CmisSession
    */
    public query(statement: string, searchAllVersions: boolean = false, queryOptions: QueryOptions = {}): Promise<any> {
      let options = queryOptions as Options;
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
     * @param {string} path 
     * @param {QueryOptions} [queryOptions={}] 
     * @returns {Promise<any>} 
     * 
     * @memberOf CmisSession
     */
    public getObjectByPath(path: string, queryOptions: QueryOptions = {}): Promise<any> {
      let options = queryOptions as Options;
      options.cmisselector = 'object';
      var sp = path.split('/');
      for (var i = sp.length - 1; i >= 0; i--) {
        sp[i] = encodeURIComponent(sp[i]);
      }
      return this.get(this.defaultRepository.rootFolderUrl + sp.join('/'), options).then(res => res.json());
    };

    /**
     * gets an object by objectId
     * 
     * @param {string} objectId 
     * @param {('this' | 'latest' | 'latestmajor')} [returnVersion] 
     * @param {QueryOptions} [queryOptions={}] 
     * @returns {Promise<any>} 
     * 
     * @memberOf CmisSession
     */
    public getObject(objectId: string, returnVersion?: 'this' | 'latest' | 'latestmajor', queryOptions: QueryOptions = {}): Promise<any> {
      let options = queryOptions as Options;
      options.cmisselector = 'object';
      options.objectId = objectId;
      options.returnVersion = returnVersion;
      return this.get(this.defaultRepository.rootFolderUrl, options).then(res => res.json());
    };

    /**
     * creates a new folder
     * 
     * @param {string} parentId 
     * @param {string} name 
     * @param {string} [type='cmis:folder'] 
     * @param {Array<any>} [policies=[]] 
     * @param {{ [k: string]: string }} [addACEs={}] 
     * @param {{ [k: string]: string }} [removeACEs={}] 
     * @returns Promise<any> 
     * 
     * @memberOf CmisSession
     */
    public createFolder(
      parentId: string,
      name: string,
      type: string = 'cmis:folder',
      policies: Array<any> = [],
      addACEs: { [k: string]: string } = {},
      removeACEs: { [k: string]: string } = {}): Promise<any> {

      let options = new Options();

      options.objectId = parentId;
      options.repositoryId = this.defaultRepository.repositoryId;
      options.cmisaction = 'createFolder';

      let properties = {
        'cmis:name': name,
        'cmis:objectTypeId': type
      };

      this.setProperties(options, properties);
      this.setPolicies(options, policies);
      this.setACEs(options, addACEs, 'add');
      this.setACEs(options, removeACEs, 'remove');
      return this.post(this.defaultRepository.rootFolderUrl, options).then(res => res.json());
    };


    /**
     * Returns children of object specified by id
     * 
     * @param {string} objectId 
     * @param {QueryOptions} queryOptions 
     * @returns Promise<any>
     * 
     * @memberOf CmisSession
     */
    public getChildren(objectId: string, queryOptions: QueryOptions = {}): Promise<any> {
      let options = queryOptions as Options;
      options.cmisselector = 'children';
      options.objectId = objectId;
      return this.get(this.defaultRepository.rootFolderUrl, options).then(res => res.json());
    };

    /**
     * Gets all descendants of specified folder
     * 
     * @param {string} folderId 
     * @param {number} [depth] 
     * @param {QueryOptions} [queryOptions={}] 
     * @returns {Promise<any>} 
     * 
     * @memberOf CmisSession
     */
    public getDescendants(folderId: string, depth?: number, queryOptions: QueryOptions = {}): Promise<any> {
      let options = queryOptions as Options;
      options.cmisselector = 'descendants';
      if (depth) {
        options.depth = depth;
      }
      options.objectId = folderId;
      return this.get(this.defaultRepository.rootFolderUrl, options).then(res => res.json());
    };

    /**
     * Gets the folder tree of the specified folder
     * 
     * @param {string} folderId 
     * @param {number} [depth] 
     * @param {QueryOptions} [queryOptions={}] 
     * @returns {Promise<any>} 
     * 
     * @memberOf CmisSession
     */
    public getFolderTree(folderId: string, depth?: number, queryOptions: QueryOptions = {}): Promise<any> {
      let options = queryOptions as Options;
      options.cmisselector = 'folderTree';
      if (depth) {
        options.depth = depth;
      }
      options.objectId = folderId;
      return this.get(this.defaultRepository.rootFolderUrl, options).then(res => res.json());
    };

    /**
     * Gets the parent folder of the specified folder
     * 
     * @param {string} folderId 
     * @param {QueryOptions} [queryOptions={}] 
     * @returns Promise<any> 
     * 
     * @memberOf CmisSession
     */
    public getFolderParent(folderId: string, queryOptions: QueryOptions = {}): Promise<any> {
      let options = queryOptions as Options;
      options.cmisselector = 'parent';
      options.objectId = folderId;
      return this.get(this.defaultRepository.rootFolderUrl, options).then(res => res.json());
    };

    /**
     * Gets the folders that are the parents of the specified object
     * 
     * @param {string} objectId 
     * @param {QueryOptions} [queryOptions={}] 
     * @returns {Promise<any>} 
     * 
     * @memberOf CmisSession
     */
    public getParents(objectId: string, queryOptions: QueryOptions = {}): Promise<any> {
      let options = queryOptions as Options;
      options.cmisselector = 'parents';
      options.objectId = objectId;
      return this.get(this.defaultRepository.rootFolderUrl, options).then(res => res.json());
    };

    /**
    * Gets the allowable actions of the specified object
    * 
    * @param {string} objectId 
    * @param {QueryOptions} [queryOptions={}] 
    * @returns {Promise<any>} 
    * 
    * @memberOf CmisSession
    */
    public getAllowableActions(objectId: string, queryOptions: QueryOptions = {}): Promise<any> {
      let options = queryOptions as Options;
      options.cmisselector = 'allowableActions';
      options.objectId = objectId;
      return this.get(this.defaultRepository.rootFolderUrl, options).then(res => res.json());
    };

    /**
    * Gets the properties of the specified object
    * 
    * @param {string} objectId 
    * @param {('this' | 'latest' | 'latestmajor')} [returnVersion] 
    * @param {QueryOptions} [queryOptions={}] 
    * @returns {Promise<any>} 
    * 
    * @memberOf CmisSession
    */
    public getProperties(objectId: string, returnVersion?: 'this' | 'latest' | 'latestmajor', queryOptions: QueryOptions = {}): Promise<any> {
      let options = queryOptions as Options;
      options.cmisselector = 'properties';
      options.objectId = objectId;
      options.returnVersion = returnVersion;
      return this.get(this.defaultRepository.rootFolderUrl, options).then(res => res.json());
    };


  }
}
