import { Observable } from "rxjs";

export interface Credentials {
    accessToken: string;
    expiration: number;
}

export interface AuthStrategy {
    getCredentials(): Observable<Credentials>;
}
