import 'isomorphic-fetch';
import { URLSearchParams } from 'urlsearchparams';
import { btoa } from 'isomorphic-base64';

export namespace cmis {

  class Options {
    succint: boolean = true;
    token: string = null;
  };

  export class CmisSession {

    private url: string;
    private token: string;
    private username: string;
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

    private 

    public loadRepositories(): Promise<Response> {

      let usp = new URLSearchParams();

      for (let k in this.options){
        usp.append(k,this.options[k]);
      }

      return fetch(`${this.url}?${usp.toString()}`, {
        headers: {
          'Authorization': 'Basic ' + btoa(`${this.username}:${this.password}`)
        }
      }).then(res => {
        if (res.status<200 || res.status>299){
          throw new Error(res.statusText);
        }
        return res;
      }).then(res => {
        return res.json().then(data => {
          for (let repo in data) {
            this.defaultRepository = data[repo];
            break;
          }
          this.repositories = data;
          return res;
        });
      });
    }

  }
}
