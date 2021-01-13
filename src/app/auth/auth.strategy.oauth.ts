import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthStrategy, Credentials } from './auth.strategy';
import { HttpResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment';

type RequestFunction = (method: string, path: string, params_: { [key: string]: string | Array<string> }, headers_: { [key: string]: string }, data: any) => Observable<HttpResponse<any>>;

export class AuthStrategyOauth implements AuthStrategy {
    private clientCredentialsBase64: string;

    constructor(private request: RequestFunction) {
        this.clientCredentialsBase64 = btoa(`${environment['oauthClientId']}:${environment['oauthClientSecret']}`)
    }

    public getCredentials(): Observable<Credentials> {
        return this.oauthToken({ 'grant_type': 'client_credentials' });
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
            return { accessToken: data.access_token, expiration: 0 };
        }));
    }
}