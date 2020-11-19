import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NavigationCancel, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, Request, RequestObserver } from '../auth/auth.service';

export interface Entry {
    request: Request;
    response?: HttpResponse<any>;
    error?: any;

    requestParams?: string;
    requestBody?: string;

    responseCode: string;
    responseBody?: string;
}

@Injectable()
export class RequestObserverService implements RequestObserver {
    public version = 1;
    public entries: Array<Entry> = [];

    private subscriptions: Array<Subscription> = [];

    constructor(private auth: AuthService, private router: Router) {
        this.auth.observer = this;
    }

    public ngOnInit() {
        this.subscriptions.push(this.router.events.subscribe(event => {
            if (event instanceof NavigationEnd || event instanceof NavigationCancel) {
                this.reset();
            }
        }));
    }

    public ngOnDestroy() {
        this.subscriptions.forEach(o => o.unsubscribe());
    }

    public reset() {
        this.version++;
        this.entries = [];
    }
    public onRequest(request: Request, response: HttpResponse<any>, error: any, version: number) {
        if (version !== this.version || request.url.indexOf('oauth') >= 0) { return; }

        if (!response) { error = error || 'Request failed'; }

        let responseCode: string = 'ERROR';
        if (error instanceof HttpErrorResponse) { 
            responseCode = `${error.status}`; 
        } else if (response) {
            responseCode = `${response.status}`;
        }

        this.entries.push({ 
            request: request, 
            response: response,
            error: error,

            requestParams: this.convertToParamsString(request.params),
            requestBody: request.body ? JSON.stringify(request.body, null, 2) : undefined,

            responseCode: responseCode,
            responseBody: response?.body ? JSON.stringify(response.body, null, 2) : undefined,
        });
    }

    private convertToParamsString(params: { [key: string]: string | Array<string> }): string {
        const keys: Array<string> = Object.keys(params || {});
        if (keys.length) {
            return '?' + keys.map(o => {
                if (Array.isArray(params[o])) {
                    return (params[o] as Array<string>).map(value => `${o}=${encodeURIComponent(value)}`).join('&');
                }
                return `${o}=${encodeURIComponent(params[o] as string)}`;
            }).join('&');
        }
        return undefined;
    }
}
