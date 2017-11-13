import { cmis as base } from './cmis'

export namespace cmis {
    export class CmisSession extends base.CmisSession {
        constructor(url: string) {
            super(url);
            this.fetch = window['fetch'];
            this.URLSearchParams = window['URLSearchParams'];
            this.btoa = window['btoa'];
            this.FormData = window['FormData'];
        }
    }
}
