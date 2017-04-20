import 'isomorphic-fetch';
import { URLSearchParams } from 'urlsearchparams';
import { btoa } from 'isomorphic-base64';

export namespace cmis {

  const GET = 'GET';
  const POST = 'POST';

  class Options {
    succinct?: boolean = true;
    token?: string;
    cmisselector: 'repositoryInfo' | 'typeChildren' | 'typeDescendants';
    typeId?: string;
    includePropertyDefinitions?: boolean; 
    depth?: number;
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

      for (let k in this.options) {
        if (options[k] !== undefined) {
          usp.append(k, this.options[k]);
        }
      }
      for (let k in options) {
        if (options[k] !== undefined) {
          usp.append(k, options[k]);
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

    public setErrorHandler(handler: (err: Error) => void): void {
      this.errorHandler = handler;
    }

    public loadRepositories(): Promise<void> {
      return this.http(GET, this.url, this.options).then(res => {
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
      return this.http(GET, this.defaultRepository.repositoryUrl, { cmisselector: 'repositoryInfo' })
        .then(res => res.json());
    }

    public getTypeChildren(typeId?: string, includePropertyDefinitions?: boolean): Promise<any> {
      return this.http(GET, this.defaultRepository.repositoryUrl, {
        cmisselector: 'typeChildren',
        typeId: typeId,
        includePropertyDefinitions: includePropertyDefinitions
      }).then(res => res.json());
    }

    public getTypeDescendants(typeId?: string, depth?: number, includePropertyDefinitions?: boolean): Promise<any> {
      return this.http(GET, this.defaultRepository.repositoryUrl, {
        cmisselector: 'typeDescendants',
        typeId: typeId,
        includePropertyDefinitions: includePropertyDefinitions,
        depth: depth
      }).then(res => res.json());

    }

  }
}
