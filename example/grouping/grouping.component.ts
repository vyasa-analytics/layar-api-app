import { Component } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LayarService } from '../layar.service';

@Component({
    selector: 'app-grouping',
    templateUrl: './grouping.component.html',
    styleUrls: ['./grouping.component.scss'],
})
export class GroupingComponent {
    public loading: boolean = false;
    public error: any = undefined;

    public text: string = 'covid\ncovid-19\ncold\ncolds\nsymptom\nsymptoms';

    public groups: Array<Array<string>>;

    constructor(private layar: LayarService) { }

    public onFindRadarTerms() {
        this.layar.requests.reset();
        this.loading = true;
        this.error = undefined;
        this.groups = [];
        const terms = this.text.split('\n').map(o => o.trim());
        this.layar.groupTerms(terms).pipe(finalize(() => {
            this.loading = false;
        })).subscribe(groups => {
            this.groups = groups;
        }, error => {
            this.error = error || true;
        });
    }
}
