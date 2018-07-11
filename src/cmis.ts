import 'cross-fetch/polyfill';
import { btoa } from 'isomorphic-base64';
import 'isomorphic-form-data';
import 'url-search-params-polyfill';


export namespace cmis {

  /**
   * used for node/browser compatibility
   */
  declare var global: any;

  /**
   * used for node/browser compatibility
   */
  const Buffer = global['Buffer'];

  class Options {
    succinct?: boolean = true;
    maxItems?: number;
    skipCount?: number;
    orderBy?: string;
    filter?: string;
    renditionFilter?: string;
    includeAllowableActions?: boolean;
    includeRelationships?: 'none' | 'source' | 'target' | 'both';
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
   */
  export class HTTPError extends Error {
    public readonly response: Response;
    constructor(response: Response) {
      super(response.statusText);
      this.response = response;
    }
  }


  /**
   * The session is the entry point for all cmis requests
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
    private charset: string;



    /**
     * format properties for requests
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
     */
    private setPolicies(options: Options, policies: Array<string>) {
      for (let i = 0; i < policies.length; i++) {
        options['policy[' + i + ']'] = policies[i];
      }
    };

    /**
     * format ACEs for requests
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
     */
    private setSecondaryTypeIds(options: Options, secondaryTypeIds: Array<string>, action: 'add' | 'remove') {
      for (let i = 0; i < secondaryTypeIds.length; i++) {
        options[action + 'SecondaryTypeId[' + i + ']'] = secondaryTypeIds[i];
      }
    };

    /**
     * internal method to perform http requests
     */
    private http(
      method: 'GET' | 'POST',
      url: string,
      options: Options,
      multipartData?: { content: string | Blob | Buffer, filename: string, mimeTypeExtension?: string }
    ): Promise<Response> {

      let body = {};

      for (let k in this.options) {
        if (this.options[k] != null && this.options[k] !== undefined) {
          body[k] = this.options[k];
        }
      }
      for (let k in options) {
        if (options[k] != null && options[k] !== undefined) {
          body[k] = options[k];
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
        let formData = new FormData();

        let content: any = multipartData.content;
        if ('string' == typeof content) {
          if (typeof (Blob) !== 'undefined')
            content = new Blob([content]);
        } else if (typeof (Buffer) !== 'undefined') {
          content = new Buffer(content);
        }
        formData.append(
          'content',
          content,
          multipartData.mimeTypeExtension ? multipartData.filename + '.' + multipartData.mimeTypeExtension : multipartData.filename);

        for (let k in body) {
          formData.append(k, '' + body[k]);
        }

        if (this.charset) {
          formData.append('_charset_', this.charset);
        }

        cfg.body = formData;
      } else {
        let usp = new URLSearchParams();
        for (let k in body) {
          usp.set(k, body[k]);
        }
        if (method !== 'GET') {
          cfg.body = usp.toString();
          cfg.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
        } else {
          url = `${url}?${usp.toString()}`;
        }
      }


      let response = fetch(url, cfg).then(res => {
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
     */
    private get(url: string, options?: Options): Promise<Response> {
      return this.http('GET', url, options);
    }


    /**
     * shorthand for http.('POST',...)
     */
    private post(
      url: string, options?: Options,
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
     */
    constructor(url: string) {
      this.url = url;
    }


    /**
     * sets token for authentication
     */
    public setToken(token: string): CmisSession {
      this.token = token;
      return this;
    }


    /**
     * sets credentials for authentication
     */
    public setCredentials(username: string, password: string): CmisSession {
      this.username = username;
      this.password = password;
      return this;
    }

    /** 
    *    IN HTML5, the character set to use for non-file fields can
    *    be specified in a multipart by using a _charset_ field.
    *    https://dev.w3.org/html5/spec-preview/attributes-common-to-form-controls.html#attr-fe-name-charset
    */
    public setCharset(charset: string): CmisSession {
      this.charset = charset;
      return this;
    }

    /**
     * sets global error handler
     */
    public setErrorHandler(handler: (err: Error) => void): void {
      this.errorHandler = handler;
    }


    /**
     * Connects to a cmis server and retrieves repositories,
     * token or credentils must already be set
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
     */
    public getRepositoryInfo(): Promise<any> {
      return this.get(this.defaultRepository.repositoryUrl, { cmisselector: 'repositoryInfo' })
        .then(res => res.json());
    }


    /**
     * gets the types that are immediate children
     * of the specified typeId, or the base types if no typeId is provided
     */
    public getTypeChildren(
      typeId?: string,
      includePropertyDefinitions?: boolean,
      options: {
        maxItems?: number,
        skipCount?: number
      } = {}
    ): Promise<any> {
      let o = options as Options;
      o.cmisselector = 'typeChildren';
      o.typeId = typeId;
      o.includePropertyDefinitions = includePropertyDefinitions;
      return this.get(this.defaultRepository.repositoryUrl, o).then(res => res.json());
    }


    /**
     * gets all types descended from the specified typeId, or all the types
     * in the repository if no typeId is provided
     */
    public getTypeDescendants(
      typeId?: string,
      depth?: number,
      includePropertyDefinitions?: boolean): Promise<any> {
      return this.get(this.defaultRepository.repositoryUrl, {
        cmisselector: 'typeDescendants',
        typeId: typeId,
        includePropertyDefinitions: includePropertyDefinitions,
        depth: depth
      }).then(res => res.json());
    }

    /**
     * gets definition of the specified type
     */
    public getTypeDefinition(typeId: string): Promise<any> {
      return this.get(this.defaultRepository.repositoryUrl, {
        cmisselector: 'typeDefinition',
        typeId: typeId,
      }).then(res => res.json());
    }

    /**
     * gets the documents that have been checked out in the repository
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
        includeRelationships?: 'none' | 'source' | 'target' | 'both',
        succinct?: boolean
      } = {}
    ): Promise<any> {
      let o = options as Options;
      o.cmisselector = 'checkedOut'
      return this.get(this.defaultRepository.repositoryUrl, o).then(res => res.json());
    };

    /**
     * performs a cmis query against the repository
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
        includeRelationships?: 'none' | 'source' | 'target' | 'both',
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
     */
    public createType(type: any): Promise<any> {
      return this.post(this.defaultRepository.repositoryUrl, {
        cmisaction: 'createType',
        type: JSON.stringify(type)
      }).then(res => res.json());
    };

    /**
     * Updates a type definition
     */
    public updateType(type: any): Promise<any> {
      return this.post(this.defaultRepository.repositoryUrl, {
        cmisaction: 'updateType',
        type: JSON.stringify(type)
      }).then(res => res.json());
    };

    /**
     * Deletes a type definition
     */
    public deleteType(typeId: string): Promise<any> {
      return this.post(this.defaultRepository.repositoryUrl, {
        cmisaction: 'deleteType',
        typeId: JSON.stringify(typeId)
      }).then(res => res.json());
    };

    /**
     * gets an object by path
     */
    public getObjectByPath(
      path: string,
      options: {
        filter?: string,
        renditionFilter?: string,
        includeAllowableActions?: boolean,
        includeRelationships?: 'none' | 'source' | 'target' | 'both',
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
     */
    public getObject(
      objectId: string,
      returnVersion?: 'this' | 'latest' | 'latestmajor',
      options: {
        filter?: string,
        renditionFilter?: string,
        includeAllowableActions?: boolean,
        includeRelationships?: 'none' | 'source' | 'target' | 'both',
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
        includeRelationships?: 'none' | 'source' | 'target' | 'both',
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
     */
    public getDescendants(
      folderId: string,
      depth?: number,
      options: {
        filter?: string,
        renditionFilter?: string,
        includeAllowableActions?: boolean,
        includeRelationships?: 'none' | 'source' | 'target' | 'both',
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
     */
    public getFolderTree(
      folderId: string,
      depth?: number,
      options: {
        filter?: string,
        renditionFilter?: string,
        includeAllowableActions?: boolean,
        includeRelationships?: 'none' | 'source' | 'target' | 'both',
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
     */
    public getParents(
      objectId: string,
      options: {
        filter?: string,
        renditionFilter?: string,
        includeAllowableActions?: boolean,
        includeRelationships?: 'none' | 'source' | 'target' | 'both',
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
        includeRelationships?: 'none' | 'source' | 'target' | 'both',
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
     * if `input` is a string it's used as the document name, otherwise as the document properties
     * 
     * use `mimeTypeExtension` if your filename does not have a standard extension (tested only with Alfresco)
     * example: 'pdf', 'png', 'jpg'
     */
    public createDocument(
      parentId: string,
      content: string | Blob | Buffer,
      input: string | { 'cmis:name': string, 'cmis:objectTypeId'?: string, [k: string]: string | string[] | number | number[] | Date | Date[] },
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
     */
    public cancelCheckOut(objectId: string): Promise<Response> {
      let options = new Options();
      options.objectId = objectId;
      options.cmisaction = 'cancelCheckOut';
      return this.post(this.defaultRepository.rootFolderUrl, options);
    };

    /**
     * checks in a document
     */
    public checkIn(
      objectId: string,
      major: boolean = false,
      input: string | { 'cmis:name': string, [k: string]: string | string[] | number | number[] | Date | Date[] },
      content: string | Blob | Buffer,
      mimeTypeExtension?: string,
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
        mimeTypeExtension: mimeTypeExtension,
        filename: properties['cmis:name'] as string
      }).then(res => res.json());

    };

    /**
     * Gets the latest document object in the version series
     *
     * {@link http://docs.oasis-open.org/cmis/CMIS/v1.1/CMIS-v1.1.html#x1-3360004}
     * 
     */
    public getObjectOfLatestVersion(
      versionSeriesId: string,
      options: {
        major?: boolean,
        filter?: string,
        renditionFilter?: string,
        includeAllowableActions?: boolean,
        includeRelationships?: 'none' | 'source' | 'target' | 'both',
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
     * Deletes a folder tree
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
     */
    public getLastResult(): Promise<any> {
      return this.post(this.defaultRepository.repositoryUrl, { cmisaction: 'lastResult' }).then(res => res.json());
    };


    /**
     * Adds specified object to folder
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
