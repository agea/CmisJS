import { cmis as base } from './cmis'

export namespace cmis {
    export class CmisSession extends base.CmisSession {
        constructor(url:string){
            super(url);
            this.fetch = require('isomorphic-fetch');
            this.URLSearchParams = require('urlsearchparams').URLSearchParams;
            this.btoa = require('isomorphic-base64').btoa;
            this.FormData  = require('isomorphic-form-data');
        }
    }

    export class HTTPError extends base.HTTPError{}
}
