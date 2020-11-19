import { Component } from '@angular/core';
import { RequestObserverService } from './request-observer.service';

@Component({
    selector: 'app-request-observer',
    templateUrl: './request-observer.component.html',
    styleUrls: ['./request-observer.component.scss']
})
export class RequestObserverComponent {
    public show: boolean = false;
    
    constructor(public requests: RequestObserverService) {}
}
