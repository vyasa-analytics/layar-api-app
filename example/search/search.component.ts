import { Component } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { Layar, LayarService } from '../layar.service';

@Component({
    selector: 'app-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.scss'],
})
export class SearchComponent {
    public loading: boolean = false;
    public error: any = undefined;

    public text: string = 'covid-19';

    public documents: Array<Layar.SourceDocument>;

    constructor(private layar: LayarService) { }

    public onFindDocuments() {
        this.layar.requests.reset();
        this.loading = true;
        this.error = undefined;
        this.documents = [];
        this.layar.getSourceDocuments(this.text, 25, 0).pipe(finalize(() => {
            this.loading = false;
        })).subscribe(documents => {
            this.documents = documents;
        }, error => {
            this.error = error || true;
        });
    }
}
