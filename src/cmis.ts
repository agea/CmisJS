import 'isomorphic-fetch';
import { URLSearchParams } from 'urlsearchparams';
import { btoa } from 'isomorphic-base64';

if ('undefined' === typeof FormData) {
  var FormData = eval("require('isomorphic-form-data')");
}

export namespace cmis {

  class Options {
    succinct?: boolean = true;
    maxItems?: number;
    skipCount?: number;
    orderBy?: string;
    filter?: string;
    renditionFilter?: string;
    includeAllowableActions?: boolean;
    includeRelationships?: boolean;
    includeACL?: boolean;
    includePolicyId?: boolean;
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
    targetFolderId?: string;
    sourceFolderId?: string;
    versioningState?: 'none' | 'major' | 'minor' | 'checkedout';
    objectIds?: string[];
    download?: 'attachment' | 'inline';
    streamId?: string;
    sourceId?: string;
    checkinComment?: string;
    major?: boolean;
    versionSeriesId?: string;
    overwriteFlag?: boolean;
    isLastChunk?: boolean;
    onlyBasicPermissions?: boolean;
    allVersions?: boolean;
    unfileObjects?: 'unfile' | 'deletesinglefiled' | 'delete';
    continueOnFailure?: boolean;
    changeLogToken?: string;
    includeProperties?: boolean;
    includePolicyIds?: boolean;
    folderId?: string;
    includeSubRelationshipTypes?: boolean;
    relationshipDirection?: string;
    policyId?: string;
    propagation?: string;

    cmisaction?: 'query' |
    'createType' |
    'updateType' |
    'deleteType' |
    'createFolder' |
    'update' |
    'move' |
    'createDocument' |
    'bulkUpdate' |
    'createDocumentFromSource' |
    'checkOut' |
    'cancelCheckOut' |
    'checkIn' |
    'setContent' |
    'appendContent' |
    'deleteContent' |
    'delete' |
    'deleteTree' |
    'createRelationship' |
    'createPolicy' |
    'createItem' |
    'lastResult' |
    'addObjectToFolder' |
    'removeObjectFromFolder' |
    'applyPolicy' |
    'removePolicy' |
    'applyACL';

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
    'properties' |
    'content' |
    'renditions' |
    'versions' |
    'policies' |
    'acl' |
    'contentChanges' |
    'relationships';
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
   *          .then(() => session.query("select * from cmis:document"))
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
    private options: Options = { succinct: true };
    public defaultRepository: any;
    public repositories: Array<any>;


    /**
     * format properties for requests
     * 
     * @private
     * @param {Options} options 
     * @param {({ [k: string]: string | string[] | number | number[] | Date | Date[] })} properties 
     * 
     * @memberof CmisSession
     */
    private setProperties(
      options: Options,
      properties: { [k: string]: string | string[] | number | number[] | Date | Date[] },
    ) {
      var i = 0;
      for (var id in properties) {
        options['propertyId[' + i + ']'] = id;
        var propertyValue = properties[id];
        if (propertyValue !== null && propertyValue !== undefined) {
          if (Object.prototype.toString.apply(propertyValue) == '[object Array]') {
            let multiProperty = propertyValue as any[];
            for (var j = 0; j < multiProperty.length; j++) {
              options['propertyValue[' + i + '][' + j + ']'] = multiProperty[j];
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
    private http(
      method: 'GET' | 'POST',
      url: String,
      options: Options,
      multipartData?: { content: string | Blob | Buffer, filename: string, mimeTypeExtension?: string }
    ): Promise<Response> {

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

      if (multipartData) {
        let formData: any = new FormData();
        let content = multipartData.content;
        if ('string' == typeof content) {
          if ('undefined' === typeof Buffer) {
            content = new Blob([content]);
          } else {
            content = new Buffer(content);
          }
        }
        formData.append(
          'content',
          content,
          multipartData.mimeTypeExtension ? multipartData.filename + '.' + multipartData.mimeTypeExtension : multipartData.filename)
        cfg.body = formData;
      }


      let response = fetch(`${url}?${usp.toString()}`, cfg).then(res => {
        if (res.status < 200 || res.status > 299) {
          throw new HTTPError(res);
        }
        return res;
      });

      if (this.errorHandler) {
        response.catch(err => this.errorHandler(err));
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
    private post(
      url: String, options?: Options,
      multipartData?: {
        content: string | Blob | Buffer,
        filename: string,
        mimeTypeExtension?: string
      }
    ): Promise<Response> {
      return this.http('POST', url, options, multipartData);
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
     * @param {{maxItems:number,skipCount:number}} [options] 
     * @returns {Promise<any>} 
     * 
     * @memberOf CmisSession
     */
    public getTypeChildren(typeId?: string, includePropertyDefinitions?: boolean, options?: { maxItems: number, skipCount: number }): Promise<any> {
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
     * @param {{ 
     *         filter?: string, 
     *         maxItems?: number, 
     *         skipCount?: number, 
     *         orderBy?: string, 
     *         renditionFilter?: string, 
     *         includeAllowableActions?: boolean, 
     *         includeRelationships?: boolean, 
     *         succinct?: boolean }} [options={}] 
     * @returns {Promise<any>} 
     * 
     * @memberOf CmisSession
     */
    public getCheckedOutDocs(
      objectId?: string,
      options: {
        filter?: string,
        maxItems?: number,
        skipCount?: number,
        orderBy?: string,
        renditionFilter?: string,
        includeAllowableActions?: boolean,
        includeRelationships?: boolean,
        succinct?: boolean
      } = {}
    ): Promise<any> {
      let o = options as Options;
      o.cmisselector = 'checkedOut'
      return this.get(this.defaultRepository.repositoryUrl, o).then(res => res.json());
    };

    /**
     * performs a cmis query against the repository
     * @param {string} statement 
     * @param {boolean} [searchAllVersions=false] 
     * @param {{
     *         maxItems?: number,
     *         skipCount?: number,
     *         orderBy?: string,
     *         renditionFilter?: string,
     *         includeAllowableActions?: boolean,
     *         includeRelationships?: boolean,
     *         succinct?: boolean
     *       }} options [options={}]
     * @returns {Promise<any>} 
     * 
     */
    public query(
      statement: string,
      searchAllVersions: boolean = false,
      options: {
        maxItems?: number,
        skipCount?: number,
        orderBy?: string,
        renditionFilter?: string,
        includeAllowableActions?: boolean,
        includeRelationships?: boolean,
        succinct?: boolean
      } = {}
    ): Promise<any> {
      let o = options as Options;
      o.cmisaction = 'query';
      o.statement = statement;
      o.searchAllVersions = searchAllVersions;
      return this.post(this.defaultRepository.repositoryUrl, o).then(res => res.json());
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
     * @param {{
     *         filter?: string,
     *         renditionFilter?: string,
     *         includeAllowableActions?: boolean,
     *         includeRelationships?: boolean,
     *         includeACL?: boolean,
     *         includePolicyIds?: boolean,
     *         succinct?: boolean
     *       }} [options={}] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public getObjectByPath(
      path: string,
      options: {
        filter?: string,
        renditionFilter?: string,
        includeAllowableActions?: boolean,
        includeRelationships?: boolean,
        includeACL?: boolean,
        includePolicyIds?: boolean,
        succinct?: boolean
      } = {}
    ): Promise<any> {
      let o = options as Options;
      o.cmisselector = 'object';
      var sp = path.split('/');
      for (var i = sp.length - 1; i >= 0; i--) {
        sp[i] = encodeURIComponent(sp[i]);
      }
      return this.get(this.defaultRepository.rootFolderUrl + sp.join('/'), o).then(res => res.json());
    };

    /**
     * gets an object by objectId
     * 
     * @param {string} objectId 
     * @param {('this' | 'latest' | 'latestmajor')} [returnVersion] 
     * @param {{
     *         filter?: string,
     *         renditionFilter?: string,
     *         includeAllowableActions?: boolean,
     *         includeRelationships?: boolean,
     *         includeACL?: boolean,
     *         includePolicyIds?: boolean,
     *         succinct?: boolean
     *       }} [options={}] 
     * @returns {Promise<any>} 
     * 
     * @memberOf CmisSession
     */
    public getObject(
      objectId: string,
      returnVersion?: 'this' | 'latest' | 'latestmajor',
      options: {
        filter?: string,
        renditionFilter?: string,
        includeAllowableActions?: boolean,
        includeRelationships?: boolean,
        includeACL?: boolean,
        includePolicyIds?: boolean,
        succinct?: boolean
      } = {}
    ): Promise<any> {
      let o = options as Options;
      o.cmisselector = 'object';
      o.objectId = objectId;
      o.returnVersion = returnVersion;
      return this.get(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
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
     * @param {{
     *         maxItems?: number,
     *         skipCount?: number,
     *         filter?: string,
     *         orderBy?: string,
     *         renditionFilter?: string,
     *         includeAllowableActions?: boolean,
     *         includeRelationships?: boolean,
     *         includePathSegment?: boolean,
     *         succinct?: boolean
     *       }} [options={}] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public getChildren(
      objectId: string,
      options: {
        maxItems?: number,
        skipCount?: number,
        filter?: string,
        orderBy?: string,
        renditionFilter?: string,
        includeAllowableActions?: boolean,
        includeRelationships?: boolean,
        includePathSegment?: boolean,
        succinct?: boolean
      } = {}
    ): Promise<any> {
      let o = options as Options;
      o.cmisselector = 'children';
      o.objectId = objectId;
      return this.get(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
    };

    /**
     * Gets all descendants of specified folder
     * 
     * @param {string} folderId 
     * @param {number} [depth] 
     * @param {{
     *         filter?: string,
     *         renditionFilter?: string,
     *         includeAllowableActions?: boolean,
     *         includeRelationships?: boolean,
     *         includePathSegment?: boolean,
     *         succinct?: boolean
     *       }} [options={}] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public getDescendants(
      folderId: string,
      depth?: number,
      options: {
        filter?: string,
        renditionFilter?: string,
        includeAllowableActions?: boolean,
        includeRelationships?: boolean,
        includePathSegment?: boolean,
        succinct?: boolean
      } = {}
    ): Promise<any> {
      let o = options as Options;
      o.cmisselector = 'descendants';
      if (depth) {
        o.depth = depth;
      }
      o.objectId = folderId;
      return this.get(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
    };

    /**
     * Gets the folder tree of the specified folder
     * 
     * @param {string} folderId 
     * @param {number} [depth] 
     * @param {{
     *         filter?: string,
     *         renditionFilter?: string,
     *         includeAllowableActions?: boolean,
     *         includeRelationships?: boolean,
     *         includePathSegment?: boolean,
     *         succinct?: boolean
     *       }} [options={}] 
     * @returns {Promise<any>} 
     * 
     * @memberOf CmisSession
     */
    public getFolderTree(
      folderId: string,
      depth?: number,
      options: {
        filter?: string,
        renditionFilter?: string,
        includeAllowableActions?: boolean,
        includeRelationships?: boolean,
        includePathSegment?: boolean,
        succinct?: boolean
      } = {}
    ): Promise<any> {
      let o = options as Options;
      o.cmisselector = 'folderTree';
      if (depth) {
        o.depth = depth;
      }
      o.objectId = folderId;
      return this.get(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
    };

    /**
     * Gets the parent folder of the specified folder
     * 
     * @param {string} folderId 
     * @param {{ succinct?: boolean }} [options={}] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public getFolderParent(
      folderId: string,
      options: { succinct?: boolean } = {}
    ): Promise<any> {
      let o = options as Options;
      o.cmisselector = 'parent';
      o.objectId = folderId;
      return this.get(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
    };

    /**
     * Gets the folders that are the parents of the specified object
     * 
     * @param {string} objectId 
     * @param {{
     *         filter?: string,
     *         renditionFilter?: string,
     *         includeAllowableActions?: boolean,
     *         includeRelationships?: boolean,
     *         includePathSegment?: boolean,
     *         succinct?: boolean
     *       }} [options={}] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public getParents(
      objectId: string,
      options: {
        filter?: string,
        renditionFilter?: string,
        includeAllowableActions?: boolean,
        includeRelationships?: boolean,
        includePathSegment?: boolean,
        succinct?: boolean
      } = {}
    ): Promise<any> {
      let o = options as Options;
      o.cmisselector = 'parents';
      o.objectId = objectId;
      return this.get(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
    };

    /**
     * Gets the allowable actions of the specified object
     * 
     * @param {string} objectId 
     * @param {{
     *         filter?: string, 
     *         maxItems?: number, 
     *         skipCount?: number, 
     *         orderBy?: string, 
     *         renditionFilter?: string, 
     *         includeAllowableActions?: boolean, 
     *         includeRelationships?: boolean, 
     *         succinct?: boolean}} [options={}] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public getAllowableActions(
      objectId: string,
      options: {
        filter?: string,
        maxItems?: number,
        skipCount?: number,
        orderBy?: string,
        renditionFilter?: string,
        includeAllowableActions?: boolean,
        includeRelationships?: boolean,
        succinct?: boolean
      } = {}
    ): Promise<any> {
      let o = options as Options;
      o.cmisselector = 'allowableActions';
      o.objectId = objectId;
      return this.get(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
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
    public getProperties(
      objectId: string,
      returnVersion?: 'this' | 'latest' | 'latestmajor',
      options: {
        filter?: string,
        succinct?: boolean
      } = {}
    ): Promise<any> {
      let o = options as Options;
      o.cmisselector = 'properties';
      o.objectId = objectId;
      o.returnVersion = returnVersion;
      return this.get(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
    };

    /**
     * Updates properties of specified object
     *
     * @param {string} objectId 
     * @param {({ [k: string]: string | string[] | number | number[] | Date | Date[] })} properties 
     * @param {{
     *         changeToken?: string,
     *         succinct?: boolean
     *       }} [options={}] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public updateProperties(
      objectId: string,
      properties: { [k: string]: string | string[] | number | number[] | Date | Date[] },
      options: {
        changeToken?: string,
        succinct?: boolean
      } = {}): Promise<any> {
      let o = options as Options;
      o.objectId = objectId;
      o.cmisaction = 'update';
      this.setProperties(options, properties);
      return this.post(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
    };

    /**
     * Moves an object
     * 
     * @param {string} objectId 
     * @param {string} sourceFolderId 
     * @param {string} targetFolderId 
     * @param {{
     *         succinct?: boolean
     *       }} [options={}] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public moveObject(
      objectId: string,
      sourceFolderId: string,
      targetFolderId: string,
      options: {
        succinct?: boolean
      } = {}): Promise<any> {
      let o = options as Options;
      o.objectId = objectId;
      o.cmisaction = 'move';
      o.targetFolderId = targetFolderId;
      o.sourceFolderId = sourceFolderId;
      return this.post(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
    };


    /**
     * creates a new document
     *
     * @param {string} parentId 
     * @param {(string | Blob | Buffer)} content 
     * @param {(string | { [k: string]: string | string[] | number | number[] | Date | Date[] })} input 
     * if `input` is a string used as the document name,
     * if `input` is an object it must contain required properties:
     *   {'cmis:name': 'docName', 'cmis:objectTypeId': 'cmis:document'}
     * @param {string} [mimeTypeExtension] 
     * extension corresponding to mimeType.
     * example: 'pdf', 'png', 'jpg',
     * use this param if your filename does not have a standard extension (tested only with Alfresco)
     * @param {('none' | 'major' | 'minor' | 'checkedout')} [versioningState] 
     * @param {string[]} [policies] 
     * @param {{ [k: string]: string }} [addACEs] 
     * @param {{ [k: string]: string }} [removeACEs] 
     * @param {{
     *         succinct?: boolean
     *       }} [options={}] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public createDocument(
      parentId: string,
      content: string | Blob | Buffer,
      input: string | { [k: string]: string | string[] | number | number[] | Date | Date[] },
      mimeTypeExtension?: string,
      versioningState?: 'none' | 'major' | 'minor' | 'checkedout',
      policies?: string[],
      addACEs?: { [k: string]: string },
      removeACEs?: { [k: string]: string },
      options: {
        succinct?: boolean
      } = {}): Promise<any> {
      let o = options as Options;
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

      return this.post(
        this.defaultRepository.rootFolderUrl, o,
        {
          content: content,
          filename: properties['cmis:name'] as string,
          mimeTypeExtension: mimeTypeExtension
        }).then(res => res.json());

    };

    /**
     * Updates properties of specified objects
     * 
     * @param {string[]} objectIds 
     * @param {({ [k: string]: string | string[] | number | number[] | Date | Date[] })} [properties={}] 
     * @param {string[]} [addSecondaryTypeIds=[]] 
     * @param {string[]} [removeSecondaryTypeIds=[]] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public bulkUpdateProperties(
      objectIds: string[],
      properties: { [k: string]: string | string[] | number | number[] | Date | Date[] } = {},
      addSecondaryTypeIds: string[] = [],
      removeSecondaryTypeIds: string[] = [],
    ): Promise<any> {
      let options = new Options();
      for (var i = objectIds.length - 1; i >= 0; i--) {
        options['objectId[' + i + ']'] = objectIds[i];
      }
      options.objectIds = objectIds;
      this.setProperties(options, properties);

      this.setSecondaryTypeIds(options, addSecondaryTypeIds, 'add');
      this.setSecondaryTypeIds(options, removeSecondaryTypeIds, 'remove');

      options.cmisaction = 'bulkUpdate';

      return this.post(this.defaultRepository.repositoryUrl, options).then(res => res.json());

    };

    /**
     * Gets document content
     * @param {string} objectId 
     * @param {('attachment'|'inline')} [download='inline'] 
     * @param {string} [streamId] 
     * @returns {Promise<Response>} 
     * 
     * @memberof CmisSession
     */
    public getContentStream(
      objectId: string,
      download: 'attachment' | 'inline' = 'inline',
      streamId?: string): Promise<Response> {
      let options = new Options();
      options.cmisselector = 'content';
      options.objectId = objectId;
      options.download = (!!download) ? 'attachment' : 'inline';

      return this.get(this.defaultRepository.rootFolderUrl, options);
    };

    /**
     * 
     * 
     * @param {string} parentId 
     * @param {string} sourceId 
     * @param {(string | Blob | Buffer)} content 
     * @param {(string | { [k: string]: string | string[] | number | number[] | Date | Date[] })} input 
     * if `input` is a string used as the document name,
     * if `input` is an object it must contain required properties:
     *   {'cmis:name': 'docName', 'cmis:objectTypeId': 'cmis:document'}
     * @param {string} [mimeTypeExtension] extension corresponding to mimeType.
     * example: 'pdf', 'png', 'jpg',
     * use this param if your filename does not have a standard extension (tested only with Alfresco)
     * @param {('none' | 'major' | 'minor' | 'checkedout')} [versioningState] 
     * @param {string[]} [policies] 
     * @param {{ [k: string]: string }} [addACEs] 
     * @param {{ [k: string]: string }} [removeACEs] 
     * @param {{
     *         succinct?: boolean
     *       }} [options={}] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public createDocumentFromSource(
      parentId: string,
      sourceId: string,
      content: string | Blob | Buffer,
      input: string | { [k: string]: string | string[] | number | number[] | Date | Date[] },
      mimeTypeExtension?: string,
      versioningState?: 'none' | 'major' | 'minor' | 'checkedout',
      policies?: string[],
      addACEs?: { [k: string]: string },
      removeACEs?: { [k: string]: string },
      options: {
        succinct?: boolean
      } = {}): Promise<any> {
      let o = options as Options;
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

      let multipartData = null;

      if (content) {
        multipartData = {
          content: content,
          filename: properties['cmis:name'] as string,
          mimeTypeExtension: mimeTypeExtension
        };
      }

      return this.post(
        this.defaultRepository.rootFolderUrl, o, multipartData
      ).then(res => res.json());

    };

    /**
     * Gets document content URL
     * 
     * @param {string} objectId 
     * @param {('attachment' | 'inline')} [download='inline'] 
     * @param {string} streamId 
     * @returns {string} 
     * 
     * @memberof CmisSession
     */
    public getContentStreamURL(objectId: string, download: 'attachment' | 'inline' = 'inline', streamId?: string): string {
      let options = new Options();
      options.cmisselector = 'content';
      options.objectId = objectId;
      options.download = download;
      options.streamId = streamId;

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

      return `${this.defaultRepository.rootFolderUrl}?${usp.toString()}`;
    };

    /**
     * gets document renditions
     * 
     * @param {string} objectId 
     * @param {{
     *         renditionFilter: string,
     *         maxItems?: number,
     *         skipCount?: number
     *       }} [options={
     *           renditionFilter: '*'
     *         }] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public getRenditions(
      objectId: string,
      options: {
        renditionFilter: string,
        maxItems?: number,
        skipCount?: number
      } = {
          renditionFilter: '*'
        }
    ): Promise<any> {
      let o = options as Options;
      o.cmisselector = 'renditions';
      o.objectId = objectId;

      return this.get(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
    };


    /**
     * checks out a document
     * 
     * @param {string} objectId 
     * @param {{ succinct?: boolean }} [options={}] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public checkOut(
      objectId: string, options: { succinct?: boolean } = {}): Promise<any> {
      let o = options as Options;
      o.objectId = objectId;
      o.cmisaction = 'checkOut';
      return this.post(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
    };

    /**
     * cancels a check out
     * 
     * @param {string} objectId 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public cancelCheckOut(objectId: string): Promise<Response> {
      let options = new Options();
      options.objectId = objectId;
      options.cmisaction = 'cancelCheckOut';
      return this.post(this.defaultRepository.rootFolderUrl, options);
    };

    /**
     * checks in a document, if needed mimetype may be specified as
     * input['cmis:contentStreamMimeType'] or as option.mimeType
     * 
     * @param {string} objectId 
     * @param {boolean} [major=false] 
     * @param {(string | { [k: string]: string | string[] | number | number[] | Date | Date[] })} input 
     * if `input` is a string used as the document name,
     * if `input` is an object it must contain required properties:
     *   {'cmis:name': 'docName'}
     * @param {(string | Blob | Buffer)} content 
     * @param {string} [comment] 
     * @param {string[]} [policies] 
     * @param {{ [k: string]: string }} [addACEs] 
     * @param {{ [k: string]: string }} [removeACEs] 
     * @param {{
     *         succinct?: boolean
     *       }} [options={}] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public checkIn(
      objectId: string,
      major: boolean = false,
      input: string | { [k: string]: string | string[] | number | number[] | Date | Date[] },
      content: string | Blob | Buffer,
      comment?: string,
      policies?: string[],
      addACEs?: { [k: string]: string },
      removeACEs?: { [k: string]: string },
      options: {
        succinct?: boolean
      } = {}): Promise<any> {

      let o = options as Options;

      if ('string' == typeof input) {
        input = {
          'cmis:name': input
        };
      }
      var properties = input || {};
      if (comment) {
        o.checkinComment = comment;
      }
      o.major = major
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
        filename: properties['cmis:name'] as string
      }).then(res => res.json());

    };

    /**
     * Gets the latest document object in the version series
     *
     * {@link http://docs.oasis-open.org/cmis/CMIS/v1.1/CMIS-v1.1.html#x1-3360004}
     * 
     * @param {string} versionSeriesId 
     * @param {{
     *         major?: boolean,
     *         filter?: string,
     *         renditionFilter?: string,
     *         includeAllowableActions?: boolean,
     *         includeRelationships?: boolean,
     *         includeACL?: boolean,
     *         includePolicyIds?: boolean,
     *         succinct?: boolean
     *       }} [options={ major: false }] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public getObjectOfLatestVersion(
      versionSeriesId: string,
      options: {
        major?: boolean,
        filter?: string,
        renditionFilter?: string,
        includeAllowableActions?: boolean,
        includeRelationships?: boolean,
        includeACL?: boolean,
        includePolicyIds?: boolean,
        succinct?: boolean
      } = { major: false }): Promise<any> {
      let o = options as Options;
      o.cmisselector = 'object';
      o.objectId = versionSeriesId;
      o.versionSeriesId = versionSeriesId;
      o.major = options.major;

      return this.get(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
    };

    /**
     * Updates content of document
     * 
     * @param {string} objectId 
     * @param {(string | Blob | Buffer)} content 
     * @param {boolean} [overwriteFlag=false] 
     * @param {string} [filename] (will not change document name: for mimetype detection by repository)
     * @param {{
     *         changeToken?: string,
     *         succinct?: boolean
     *       }} [options={}] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public setContentStream(
      objectId: string,
      content: string | Blob | Buffer,
      overwriteFlag: boolean = false,
      filename?: string,
      options: {
        changeToken?: string,
        succinct?: boolean
      } = {}): Promise<any> {
      let o = options as Options;
      o.objectId = objectId;
      o.overwriteFlag = overwriteFlag;
      o.cmisaction = 'setContent';

      return this.post(
        this.defaultRepository.rootFolderUrl, o,
        {
          content: content,
          filename: filename
        }).then(res => res.json());

    };

    /**
     * Appends content to document
     * 
     * @param {string} objectId 
     * @param {(string | Blob | Buffer)} content 
     * @param {boolean} [isLastChunk=false] 
     * @param {string} [filename] (will not change document name: for mimetype detection by repository)
     * @param {{
     *         changeToken?: string,
     *         succinct?: boolean
     *       }} [options={}] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public appendContentStream(
      objectId: string,
      content: string | Blob | Buffer,
      isLastChunk: boolean = false,
      filename?: string,
      options: {
        changeToken?: string,
        succinct?: boolean
      } = {}): Promise<any> {
      let o = options as Options;
      o.objectId = objectId;
      o.cmisaction = 'appendContent';
      o.isLastChunk = isLastChunk;
      return this.post(
        this.defaultRepository.rootFolderUrl, o,
        {
          content: content,
          filename: filename
        }).then(res => res.json());
    };

    /**
     * deletes object content
     * 
     * @param {string} objectId 
     * @param {{
     *         changeToken?: string,
     *         succinct?: boolean
     *       }} [options={}] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public deleteContentStream(
      objectId: string,
      options: {
        changeToken?: string,
        succinct?: boolean
      } = {}): Promise<any> {
      let o = options as Options;
      o.objectId = objectId;
      o.cmisaction = 'deleteContent';

      return this.post(this.defaultRepository.rootFolderUrl, o);
    };

    /**
     * gets versions of object
     * 
     * @param {string} versionSeriesId 
     * @param {{
     *         filter?:string, 
     *         includeAllowableActions?:boolean, 
     *         succinct?:boolean
     *       }} [options={}] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public getAllVersions(
      versionSeriesId: string,
      options: {
        filter?: string,
        includeAllowableActions?: boolean,
        succinct?: boolean
      } = {}): Promise<any> {
      let o = options as Options;
      o.versionSeriesId = versionSeriesId;
      o.cmisselector = 'versions';

      return this.get(this.defaultRepository.rootFolderUrl, o);

    };


    /**
     * gets object applied policies
     * 
     * @param {string} objectId 
     * @param {{
     *         filter?: string,
     *         succinct?: boolean
     *       }} [options={}] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public getAppliedPolicies(
      objectId: string,
      options: {
        filter?: string,
        succinct?: boolean
      } = {}): Promise<any> {
      let o = options as Options;
      o.objectId = objectId;
      o.cmisselector = 'policies';
      return this.get(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
    };

    /**
     * gets object ACL
     * 
     * @param {string} objectId 
     * @param {boolean} [onlyBasicPermissions=false] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public getACL(
      objectId: string,
      onlyBasicPermissions: boolean = false): Promise<any> {
      let options = new Options();
      options.objectId = objectId;
      options.onlyBasicPermissions = onlyBasicPermissions;
      options.cmisselector = 'acl';
      return this.get(this.defaultRepository.rootFolderUrl, options).then(res => res.json());
    };

    /**
     * deletes an object
     * @param {String} objectId
     * @param {Boolean} allVersions
     * @param {Object} options (possible options: token)
     * @return {CmisRequest}
     */
    public deleteObject(
      objectId: string,
      allVersions: boolean = false): Promise<Response> {
      let options = new Options();
      options.repositoryId = this.defaultRepository.repositoryId;
      options.cmisaction = 'delete';
      options.objectId = objectId;
      options.allVersions = allVersions;
      return this.post(this.defaultRepository.rootFolderUrl, options);
    };

    /**
     * Deletes a folfder tree
     * 
     * @param {any} objectId 
     * @param {boolean} [allVersions=false] 
     * @param {('unfile' | 'deletesinglefiled' | 'delete')} [unfileObjects] 
     * @param {boolean} [continueOnFailure=false] 
     * @returns {Promise<Response>} 
     * 
     * @memberof CmisSession
     */
    public deleteTree(
      objectId,
      allVersions: boolean = false,
      unfileObjects?: 'unfile' | 'deletesinglefiled' | 'delete',
      continueOnFailure: boolean = false): Promise<Response> {
      let options = new Options();
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

    /**
     * gets the changed objects, the list object should contain the next change log token.
     * @param {String} changeLogToken
     * @param {Boolean} includeProperties
     * @param {Boolean} includePolicyIds
     * @param {Boolean} includeACL
     * @param {Object} options (possible options: maxItems, succinct, token)
     * @return {CmisRequest}
     */
    public getContentChanges(
      changeLogToken?: string,
      includeProperties: boolean = false,
      includePolicyIds: boolean = false,
      includeACL: boolean = false,
      options: {
        maxItems?: number,
        succinct?: boolean
      } = {}): Promise<any> {

      let o = options as Options;
      o.cmisselector = 'contentChanges';
      if (changeLogToken) {
        o.changeLogToken = changeLogToken;
      }
      o.includeProperties = includeProperties;
      o.includePolicyIds = includePolicyIds;
      o.includeACL = includeACL;

      return this.get(this.defaultRepository.repositoryUrl, o).then(res => res.json());
    };


    /**
     * Creates a relationship
     * 
     * @param {({ [k: string]: string | string[] | number | number[] | Date | Date[] })} properties 
     * @param {string[]} [policies] 
     * @param {{ [k: string]: string }} [addACEs] 
     * @param {{ [k: string]: string }} [removeACEs] 
     * @param {{
     *         succinct?: boolean
     *       }} [options={}] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public createRelationship(
      properties: { [k: string]: string | string[] | number | number[] | Date | Date[] },
      policies?: string[],
      addACEs?: { [k: string]: string },
      removeACEs?: { [k: string]: string },
      options: {
        succinct?: boolean
      } = {}): Promise<any> {

      let o = options as Options;
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

      return this.post(this.defaultRepository.repositoryUrl, o).then(res => res.json());
    };

    /**
     * Creates a policy
     * 
     * @param {string} folderId 
     * @param {({ [k: string]: string | string[] | number | number[] | Date | Date[] })} properties 
     * @param {string[]} [policies] 
     * @param {{ [k: string]: string }} [addACEs] 
     * @param {{ [k: string]: string }} [removeACEs] 
     * @param {{
     *         succinct?: boolean
     *       }} [options={}] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public createPolicy(
      folderId: string,
      properties: { [k: string]: string | string[] | number | number[] | Date | Date[] },
      policies?: string[],
      addACEs?: { [k: string]: string },
      removeACEs?: { [k: string]: string },
      options: {
        succinct?: boolean
      } = {}): Promise<any> {

      let o = options as Options;
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
      return this.post(this.defaultRepository.repositoryUrl, o).then(res => res.json());
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
    public createItem(
      folderId: string,
      properties: { [k: string]: string | string[] | number | number[] | Date | Date[] },
      policies?: string[],
      addACEs?: { [k: string]: string },
      removeACEs?: { [k: string]: string },
      options: {
        succinct?: boolean
      } = {}): Promise<any> {

      let o = options as Options;
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
      return this.post(this.defaultRepository.repositoryUrl, o).then(res => res.json());

    };

    /**
     * gets last result
     * 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public getLastResult(): Promise<any> {
      return this.post(this.defaultRepository.repositoryUrl, { cmisaction: 'lastResult' }).then(res => res.json());
    };


    /**
     * Adds specified object to folder
     * 
     * @param {string} objectId 
     * @param {string} folderId 
     * @param {boolean} [allVersions=false] 
     * @param {{
     *         succinct?: boolean
     *       }} [options={}] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public addObjectToFolder(
      objectId: string,
      folderId: string,
      allVersions: boolean = false,
      options: {
        succinct?: boolean
      } = {}): Promise<any> {
      let o = options as Options;
      o.objectId = objectId;
      o.cmisaction = 'addObjectToFolder';
      o.allVersions = allVersions;
      o.folderId = folderId;

      return this.post(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
    };

    /**
     * Removes specified object from folder
     * 
     * @param {string} objectId 
     * @param {string} folderId 
     * @param {{
     *         succinct?: boolean
     *       }} [options={}] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public removeObjectFromFolder(
      objectId: string,
      folderId: string,
      options: {
        succinct?: boolean
      } = {}): Promise<any> {
      let o = options as Options;
      o.objectId = objectId;
      o.cmisaction = 'removeObjectFromFolder';
      o.folderId = folderId;
      return this.post(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
    };


    /**
     * gets object relationships
     * 
     * @param {string} objectId 
     * @param {boolean} [includeSubRelationshipTypes=false] 
     * @param {string} [relationshipDirection] 
     * @param {string} [typeId] 
     * @param {{
     *         maxItems?: number,
     *         skipCount?: number,
     *         includeAllowableActions?: boolean,
     *         filter?: string,
     *         succinct?: boolean
     *       }} [options={}] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public getObjectRelationships(
      objectId: string,
      includeSubRelationshipTypes: boolean = false,
      relationshipDirection?: string,
      typeId?: string,
      options: {
        maxItems?: number,
        skipCount?: number,
        includeAllowableActions?: boolean,
        filter?: string,
        succinct?: boolean
      } = {}): Promise<any> {
      let o = options as Options;
      o.objectId = objectId;
      o.includeSubRelationshipTypes = includeSubRelationshipTypes;
      o.relationshipDirection = relationshipDirection || 'either';
      if (typeId) {
        o.typeId = typeId;
      }
      o.cmisselector = 'relationships';
      return this.get(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
    };


    /**
     * applies policy to object
     * 
     * @param {string} objectId 
     * @param {string} policyId 
     * @param {{
     *         succinct?: boolean
     *       }} [options={}] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public applyPolicy(
      objectId: string,
      policyId: string,
      options: {
        succinct?: boolean
      } = {}): Promise<any> {
      let o = options as Options;
      o.objectId = objectId;
      o.policyId = policyId;
      o.cmisaction = 'applyPolicy';

      return this.post(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
    };

    /**
     * removes policy from object
     * 
     * @param {string} objectId 
     * @param {string} policyId 
     * @param {{
     *         succinct?: boolean
     *       }} [options={}] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public removePolicy(
      objectId: string,
      policyId: string,
      options: {
        succinct?: boolean
      } = {}): Promise<any> {
      let o = options as Options;
      o.objectId = objectId;
      o.policyId = policyId;
      o.cmisaction = 'removePolicy';
      return this.post(this.defaultRepository.rootFolderUrl, o).then(res => res.json());
    };

    /**
     * applies ACL to object
     * 
     * @param {string} objectId 
     * @param {{ [k: string]: string }} [addACEs] 
     * @param {{ [k: string]: string }} [removeACEs] 
     * @param {string} [propagation] 
     * @returns {Promise<any>} 
     * 
     * @memberof CmisSession
     */
    public applyACL(
      objectId: string,
      addACEs?: { [k: string]: string },
      removeACEs?: { [k: string]: string },
      propagation?: string): Promise<any> {
      let options = new Options();
      options.objectId = objectId;
      options.cmisaction = 'applyACL';
      options.propagation = propagation;
      if (addACEs) {
        this.setACEs(options, addACEs, 'add');
      }
      if (removeACEs) {
        this.setACEs(options, removeACEs, 'remove');
      }
      return this.post(this.defaultRepository.rootFolderUrl, options).then(res => res.json());
    };

  }
}
