import { Component } from '@angular/core';
import { AuthStrategyUser } from '../auth/auth.strategy.user';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
    public get user(): any {
        return AuthStrategyUser.instance?.user;
    }

    public onLogout() {
        AuthStrategyUser.instance.userLogout();
    }
}
