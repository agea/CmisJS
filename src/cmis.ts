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
    type?:string;
    cmisaction?: 'query'|'createType';
    cmisselector?:
    'repositoryInfo' |
    'typeChildren' |
    'typeDescendants' |
    'typeDefinition' |
    'checkedOut';
  };

  export class HTTPError extends Error {
    private response: Response;
    constructor(response: Response) {
      super(response.statusText);
      this.response = response;
    }
    public getResponse(): Response {
      return this.response;
    }
  }

  export class CmisSession {

    private url: string;
    private token: string;
    private username: string;
    private errorHandler: (err: Error) => void;
    private password: string;
    private options: Options = new Options();
    public defaultRepository: any;
    public repositories: Array<any>;

    constructor(url: string) {
      this.url = url;
    }

    public setToken(token: string): CmisSession {
      this.options.token = token;
      return this;
    }

    public setCredentials(username: string, password: string): CmisSession {
      this.username = username;
      this.password = password;
      return this;
    }

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

    private get(url: String, options?: Options): Promise<Response> {
      return this.http('GET', url, options);
    }

    private post(url: String, options?: Options): Promise<Response> {
      return this.http('POST', url, options);
    }

    public setErrorHandler(handler: (err: Error) => void): void {
      this.errorHandler = handler;
    }

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

    public getRepositoryInfo(): Promise<any> {
      return this.get(this.defaultRepository.repositoryUrl, { cmisselector: 'repositoryInfo' })
        .then(res => res.json());
    }

    public getTypeChildren(typeId?: string, includePropertyDefinitions?: boolean): Promise<any> {
      return this.get(this.defaultRepository.repositoryUrl, {
        cmisselector: 'typeChildren',
        typeId: typeId,
        includePropertyDefinitions: includePropertyDefinitions
      }).then(res => res.json());
    }

    public getTypeDescendants(typeId?: string, depth?: number, includePropertyDefinitions?: boolean): Promise<any> {
      return this.get(this.defaultRepository.repositoryUrl, {
        cmisselector: 'typeDescendants',
        typeId: typeId,
        includePropertyDefinitions: includePropertyDefinitions,
        depth: depth
      }).then(res => res.json());

    }

    public getTypeDefinition(typeId: string): Promise<any> {
      return this.get(this.defaultRepository.repositoryUrl, {
        cmisselector: 'typeDefinition',
        typeId: typeId,
      }).then(res => res.json());
    }

    /**
    * gets the documents that have been checked out in the repository
    * @param {String} objectId
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
     * Creates a new type
     * @param {Object} type
     * @return {Promise<any>}
     *
     */
    public createType(type:any): Promise<any> {
      return this.post(this.defaultRepository.repositoryUrl,{
        cmisaction:'createType',
        type: JSON.stringify(type)
      }).then(res => res.json());
    };

  }
}
