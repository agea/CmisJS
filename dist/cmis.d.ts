/// <reference types="node" />
import 'cross-fetch/polyfill';
import 'isomorphic-form-data';
import 'url-search-params-polyfill';
export declare namespace cmis {
    class HTTPError extends Error {
        readonly response: Response;
        constructor(response: Response);
    }
    class CmisSession {
        private url;
        private token;
        private username;
        private errorHandler;
        private password;
        private options;
        defaultRepository: any;
        repositories: Array<any>;
        private charset;
        private setProperties(options, properties);
        private setPolicies(options, policies);
        private setACEs(options, ACEs, action);
        private setSecondaryTypeIds(options, secondaryTypeIds, action);
        private http(method, url, options, multipartData?);
        private get(url, options?);
        private post(url, options?, multipartData?);
        constructor(url: string);
        setToken(token: string): CmisSession;
        setCredentials(username: string, password: string): CmisSession;
        setCharset(charset: string): CmisSession;
        setErrorHandler(handler: (err: Error) => void): void;
        loadRepositories(): Promise<void>;
        getRepositoryInfo(): Promise<any>;
        getTypeChildren(typeId?: string, includePropertyDefinitions?: boolean, options?: {
            maxItems?: number;
            skipCount?: number;
        }): Promise<any>;
        getTypeDescendants(typeId?: string, depth?: number, includePropertyDefinitions?: boolean): Promise<any>;
        getTypeDefinition(typeId: string): Promise<any>;
        getCheckedOutDocs(objectId?: string, options?: {
            filter?: string;
            maxItems?: number;
            skipCount?: number;
            orderBy?: string;
            renditionFilter?: string;
            includeAllowableActions?: boolean;
            includeRelationships?: 'none' | 'source' | 'target' | 'both';
            succinct?: boolean;
        }): Promise<any>;
        query(statement: string, searchAllVersions?: boolean, options?: {
            maxItems?: number;
            skipCount?: number;
            orderBy?: string;
            renditionFilter?: string;
            includeAllowableActions?: boolean;
            includeRelationships?: 'none' | 'source' | 'target' | 'both';
            succinct?: boolean;
        }): Promise<any>;
        createType(type: any): Promise<any>;
        updateType(type: any): Promise<any>;
        deleteType(typeId: string): Promise<any>;
        getObjectByPath(path: string, options?: {
            filter?: string;
            renditionFilter?: string;
            includeAllowableActions?: boolean;
            includeRelationships?: 'none' | 'source' | 'target' | 'both';
            includeACL?: boolean;
            includePolicyIds?: boolean;
            succinct?: boolean;
        }): Promise<any>;
        getObject(objectId: string, returnVersion?: 'this' | 'latest' | 'latestmajor', options?: {
            filter?: string;
            renditionFilter?: string;
            includeAllowableActions?: boolean;
            includeRelationships?: 'none' | 'source' | 'target' | 'both';
            includeACL?: boolean;
            includePolicyIds?: boolean;
            succinct?: boolean;
        }): Promise<any>;
        createFolder(parentId: string, name: string, type?: string, policies?: Array<any>, addACEs?: {
            [k: string]: string;
        }, removeACEs?: {
            [k: string]: string;
        }): Promise<any>;
        getChildren(objectId: string, options?: {
            maxItems?: number;
            skipCount?: number;
            filter?: string;
            orderBy?: string;
            renditionFilter?: string;
            includeAllowableActions?: boolean;
            includeRelationships?: 'none' | 'source' | 'target' | 'both';
            includePathSegment?: boolean;
            succinct?: boolean;
        }): Promise<any>;
        getDescendants(folderId: string, depth?: number, options?: {
            filter?: string;
            renditionFilter?: string;
            includeAllowableActions?: boolean;
            includeRelationships?: 'none' | 'source' | 'target' | 'both';
            includePathSegment?: boolean;
            succinct?: boolean;
        }): Promise<any>;
        getFolderTree(folderId: string, depth?: number, options?: {
            filter?: string;
            renditionFilter?: string;
            includeAllowableActions?: boolean;
            includeRelationships?: 'none' | 'source' | 'target' | 'both';
            includePathSegment?: boolean;
            succinct?: boolean;
        }): Promise<any>;
        getFolderParent(folderId: string, options?: {
            succinct?: boolean;
        }): Promise<any>;
        getParents(objectId: string, options?: {
            filter?: string;
            renditionFilter?: string;
            includeAllowableActions?: boolean;
            includeRelationships?: 'none' | 'source' | 'target' | 'both';
            includePathSegment?: boolean;
            succinct?: boolean;
        }): Promise<any>;
        getAllowableActions(objectId: string, options?: {
            filter?: string;
            maxItems?: number;
            skipCount?: number;
            orderBy?: string;
            renditionFilter?: string;
            includeAllowableActions?: boolean;
            includeRelationships?: 'none' | 'source' | 'target' | 'both';
            succinct?: boolean;
        }): Promise<any>;
        getProperties(objectId: string, returnVersion?: 'this' | 'latest' | 'latestmajor', options?: {
            filter?: string;
            succinct?: boolean;
        }): Promise<any>;
        updateProperties(objectId: string, properties: {
            [k: string]: string | string[] | number | number[] | Date | Date[];
        }, options?: {
            changeToken?: string;
            succinct?: boolean;
        }): Promise<any>;
        moveObject(objectId: string, sourceFolderId: string, targetFolderId: string, options?: {
            succinct?: boolean;
        }): Promise<any>;
        createDocument(parentId: string, content: string | Blob | Buffer, input: string | {
            'cmis:name': string;
            'cmis:objectTypeId'?: string;
            [k: string]: string | string[] | number | number[] | Date | Date[];
        }, mimeTypeExtension?: string, versioningState?: 'none' | 'major' | 'minor' | 'checkedout', policies?: string[], addACEs?: {
            [k: string]: string;
        }, removeACEs?: {
            [k: string]: string;
        }, options?: {
            succinct?: boolean;
        }): Promise<any>;
        bulkUpdateProperties(objectIds: string[], properties?: {
            [k: string]: string | string[] | number | number[] | Date | Date[];
        }, addSecondaryTypeIds?: string[], removeSecondaryTypeIds?: string[]): Promise<any>;
        getContentStream(objectId: string, download?: 'attachment' | 'inline', streamId?: string): Promise<Response>;
        createDocumentFromSource(parentId: string, sourceId: string, content: string | Blob | Buffer, input: string | {
            [k: string]: string | string[] | number | number[] | Date | Date[];
        }, mimeTypeExtension?: string, versioningState?: 'none' | 'major' | 'minor' | 'checkedout', policies?: string[], addACEs?: {
            [k: string]: string;
        }, removeACEs?: {
            [k: string]: string;
        }, options?: {
            succinct?: boolean;
        }): Promise<any>;
        getContentStreamURL(objectId: string, download?: 'attachment' | 'inline', streamId?: string): string;
        getRenditions(objectId: string, options?: {
            renditionFilter: string;
            maxItems?: number;
            skipCount?: number;
        }): Promise<any>;
        checkOut(objectId: string, options?: {
            succinct?: boolean;
        }): Promise<any>;
        cancelCheckOut(objectId: string): Promise<Response>;
        checkIn(objectId: string, major: boolean, input: string | {
            'cmis:name': string;
            [k: string]: string | string[] | number | number[] | Date | Date[];
        }, content: string | Blob | Buffer, mimeTypeExtension?: string, comment?: string, policies?: string[], addACEs?: {
            [k: string]: string;
        }, removeACEs?: {
            [k: string]: string;
        }, options?: {
            succinct?: boolean;
        }): Promise<any>;
        getObjectOfLatestVersion(versionSeriesId: string, options?: {
            major?: boolean;
            filter?: string;
            renditionFilter?: string;
            includeAllowableActions?: boolean;
            includeRelationships?: 'none' | 'source' | 'target' | 'both';
            includeACL?: boolean;
            includePolicyIds?: boolean;
            succinct?: boolean;
        }): Promise<any>;
        setContentStream(objectId: string, content: string | Blob | Buffer, overwriteFlag?: boolean, filename?: string, options?: {
            changeToken?: string;
            succinct?: boolean;
        }): Promise<any>;
        appendContentStream(objectId: string, content: string | Blob | Buffer, isLastChunk?: boolean, filename?: string, options?: {
            changeToken?: string;
            succinct?: boolean;
        }): Promise<any>;
        deleteContentStream(objectId: string, options?: {
            changeToken?: string;
            succinct?: boolean;
        }): Promise<any>;
        getAllVersions(versionSeriesId: string, options?: {
            filter?: string;
            includeAllowableActions?: boolean;
            succinct?: boolean;
        }): Promise<any>;
        getAppliedPolicies(objectId: string, options?: {
            filter?: string;
            succinct?: boolean;
        }): Promise<any>;
        getACL(objectId: string, onlyBasicPermissions?: boolean): Promise<any>;
        deleteObject(objectId: string, allVersions?: boolean): Promise<Response>;
        deleteTree(objectId: any, allVersions?: boolean, unfileObjects?: 'unfile' | 'deletesinglefiled' | 'delete', continueOnFailure?: boolean): Promise<Response>;
        getContentChanges(changeLogToken?: string, includeProperties?: boolean, includePolicyIds?: boolean, includeACL?: boolean, options?: {
            maxItems?: number;
            succinct?: boolean;
        }): Promise<any>;
        createRelationship(properties: {
            [k: string]: string | string[] | number | number[] | Date | Date[];
        }, policies?: string[], addACEs?: {
            [k: string]: string;
        }, removeACEs?: {
            [k: string]: string;
        }, options?: {
            succinct?: boolean;
        }): Promise<any>;
        createPolicy(folderId: string, properties: {
            [k: string]: string | string[] | number | number[] | Date | Date[];
        }, policies?: string[], addACEs?: {
            [k: string]: string;
        }, removeACEs?: {
            [k: string]: string;
        }, options?: {
            succinct?: boolean;
        }): Promise<any>;
        createItem(folderId: string, properties: {
            [k: string]: string | string[] | number | number[] | Date | Date[];
        }, policies?: string[], addACEs?: {
            [k: string]: string;
        }, removeACEs?: {
            [k: string]: string;
        }, options?: {
            succinct?: boolean;
        }): Promise<any>;
        getLastResult(): Promise<any>;
        addObjectToFolder(objectId: string, folderId: string, allVersions?: boolean, options?: {
            succinct?: boolean;
        }): Promise<any>;
        removeObjectFromFolder(objectId: string, folderId: string, options?: {
            succinct?: boolean;
        }): Promise<any>;
        getObjectRelationships(objectId: string, includeSubRelationshipTypes?: boolean, relationshipDirection?: string, typeId?: string, options?: {
            maxItems?: number;
            skipCount?: number;
            includeAllowableActions?: boolean;
            filter?: string;
            succinct?: boolean;
        }): Promise<any>;
        applyPolicy(objectId: string, policyId: string, options?: {
            succinct?: boolean;
        }): Promise<any>;
        removePolicy(objectId: string, policyId: string, options?: {
            succinct?: boolean;
        }): Promise<any>;
        applyACL(objectId: string, addACEs?: {
            [k: string]: string;
        }, removeACEs?: {
            [k: string]: string;
        }, propagation?: string): Promise<any>;
    }
}
