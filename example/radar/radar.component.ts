import { Component } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { Layar, LayarService } from '../layar.service';

@Component({
    selector: 'app-radar',
    templateUrl: './radar.component.html',
    styleUrls: ['./radar.component.scss'],
})
export class RadarComponent {
    public loading: boolean = false;
    public error: any = undefined;

    public text: string = 'fabry disease';

    public terms: Array<Layar.RadarTerm>;

    constructor(private layar: LayarService) { }

    public onFindRadarTerms() {
        this.layar.requests.reset();
        this.loading = true;
        this.error = undefined;
        this.terms = [];
        this.layar.getRadarTerms(this.text, 25, 0).pipe(finalize(() => {
            this.loading = false;
        })).subscribe(terms => {
            this.terms = terms;
        }, error => {
            this.error = error || true;
        });
    }
}
