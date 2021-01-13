import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { AuthStrategyUser } from '../auth/auth.strategy.user';

@Component({
    selector: 'app-user-login',
    templateUrl: './user-login.component.html',
    styleUrls: ['./user-login.component.scss'],
})
export class UserLoginComponent {
    public get shouldShowLoginForm(): boolean {
        return !!AuthStrategyUser.instance?.pending;
    }

    public form: FormGroup;
    public loading: boolean = false;
    public error: boolean = false;

    constructor() {
        this.form = new FormGroup({});
        this.form.addControl('email', new FormControl('', [Validators.required]));
        this.form.addControl('password', new FormControl('', [Validators.required, Validators.minLength(8)]));
    }

    public ngOnInit() {
        if (!AuthStrategyUser.instance) { return; }
        AuthStrategyUser.instance.getCredentials().subscribe(() => {});
    }

    public signIn() {
        const email: string = this.form.controls['email'].value.trim();
        const password: string = this.form.controls['password'].value;

        this.loading = true;
        AuthStrategyUser.instance.userLogin(email, password).subscribe(() => {}, error => {
            this.loading = false;
            this.error = true;
            setTimeout(() => this.error = false, 3000);
        });
    }
}
