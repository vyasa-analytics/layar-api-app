import { Observable, of, Subject, throwError } from 'rxjs';
import { catchError, delay, map, mergeMap, tap } from 'rxjs/operators';
import { AuthStrategy, Credentials } from './auth.strategy';
import { HttpResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment';

type RequestFunction = (method: string, path: string, params: { [key: string]: string | Array<string> }, headers: { [key: string]: string }, data: any) => Observable<HttpResponse<any>>;

interface User {
    id: number;
    username: string;
    email?: string;
    fullName?: string;
}

export class AuthStrategyUser implements AuthStrategy {
    public static instance: AuthStrategyUser;
    public pending: Subject<Credentials>;

    private clientCredentialsBase64: string = btoa(`${environment['oauthClientId']}:${environment['oauthClientSecret']}`)

    public user: User;

    constructor(private request: RequestFunction) {
        AuthStrategyUser.instance = this;
    }

    public getCredentials(): Observable<Credentials> {
        const credentials = this.readCredentialsFromLocalStorage();
        if (credentials) { return this.ensureUserExists(credentials); }

        this.pending = new Subject<Credentials>();
        return this.pending;
    }

    public userLogin(username: string, password: string): Observable<Credentials> {
        this.user = undefined;

        return this.oauthToken({
            grant_type: 'password',
            scope: 'read write',
            password: password,
            username: username,
        }).pipe(mergeMap(credentials => {
            return this.ensureUserExists(credentials);
        }), tap(credentials => {
            this.pending.next(credentials);
            this.pending.complete();
            this.pending = undefined;
        }));
    }

    public refreshCredentials?(credentials: Credentials): Observable<Credentials> {
        return this.userRefresh(credentials.refreshToken);
    }

    private userRefresh(token: string): Observable<Credentials> {
        return this.oauthToken({ 
            grant_type: 'refresh_token', 
            refresh_token: token 
        }).pipe(tap(credentials => {}, error => {
            this.user = undefined;
        }));
    }

    private ensureUserExists(credentials: Credentials): Observable<Credentials> {
        if (this.user) { return of(credentials).pipe(delay(0)); }

        return this.fetchCurrentUser(credentials).pipe(catchError(response => {
            const error = `${ response?.error?.error ||'' }`.toLowerCase();
            if (error !== 'invalid_token') { return throwError(response); }
            return this.userRefresh(credentials.refreshToken).pipe(mergeMap(o => {
                credentials = o;
                return this.fetchCurrentUser(credentials);
            }));
        }), map(user => {
            this.user = user;
            this.writeCredentialsToLocalStorage(credentials);
            return credentials;
        }));
    }

    private fetchCurrentUser(credentials: Credentials): Observable<User> {
        const headers = { 'Authorization': `Bearer ${credentials.accessToken}` };
        return this.request('GET', '/connect/people', {}, headers, undefined).pipe(map(response => response.body));
    }

    private oauthToken(params: { [key: string]: string }): Observable<Credentials> {
        let headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + this.clientCredentialsBase64,
        };
        
        params['TIMEOUT_MS'] = '10000';
        let data = params.password ? `password=${encodeURIComponent(params.password)}` : '';
        delete params.password;

        return this.request('POST', '/connect/oauth/token', params, headers, data).pipe(map(response => {
            let data = response.body;
            if (!data.access_token) { throw 'Invalid access token'; }
            return { accessToken: data.access_token, refreshToken: data.refresh_token, expiration: 0 };
        }));
    }

    private readonly CREDENTIALS_KEY = 'vyasa.credentials';
    private readCredentialsFromLocalStorage(): Credentials {
        let credentials = localStorage.getItem(this.CREDENTIALS_KEY);
        if (!credentials) { return undefined; }
        return JSON.parse(credentials) as Credentials;
    }
    private writeCredentialsToLocalStorage(credentials: Credentials) {
        if (!credentials) {
            localStorage.removeItem(this.CREDENTIALS_KEY)
        } else {
            localStorage.setItem(this.CREDENTIALS_KEY, JSON.stringify(credentials));
        }
    }
}