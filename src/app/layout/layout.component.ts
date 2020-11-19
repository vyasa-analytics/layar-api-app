import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationCancel, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-layout',
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
    public hideNav: boolean = false;
    public showMenu: boolean = false;

    private subscriptions: Array<Subscription> = [];

    constructor(private router: Router, private route: ActivatedRoute) { }

    public ngOnInit() {
        this.hideNav = !!this.route.snapshot.queryParams.hideNav;
        
        this.subscriptions.push(this.router.events.subscribe(event => {
            if (event instanceof NavigationEnd || event instanceof NavigationCancel) {
                this.showMenu = false;
            }
        }));
    }

    public ngOnDestroy() {
        this.subscriptions.forEach(o => o.unsubscribe());
    }
}
