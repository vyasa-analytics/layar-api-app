import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthStrategy, Credentials } from './auth.strategy';

declare const grecaptcha: any;

export class AuthStrategyRecaptcha implements AuthStrategy {
    private recaptchaSiteKey: string = environment['recaptchaSiteKey'];

    constructor(private http: HttpClient) { this.initialize(); }

    private initialize() {
        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/api.js?render=${this.recaptchaSiteKey}`;
        document.head.appendChild(script);
    }

    public getCredentials(): Observable<Credentials> {
        const result = new Subject<Credentials>();
        grecaptcha.ready(() => grecaptcha.execute(this.recaptchaSiteKey, { action: 'submit' }).then(token => {
            this.http.get(environment['apiUrl'] + '/token', {
                params: { 'g-recaptcha-response': token },
            }).pipe(map((response: any) => {
                return { accessToken: response.token, expiration: Date.now() + 60000 };
            })).subscribe(result);
        }));
        // TODO handle errors
        return result;
    }
}
