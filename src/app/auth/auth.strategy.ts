import { Observable } from "rxjs";

export interface Credentials {
    accessToken: string;
    refreshToken?: string;
    expiration: number;
}

export interface AuthStrategy {
    getCredentials(): Observable<Credentials>;
    refreshCredentials?(credentials: Credentials): Observable<Credentials>;
}
