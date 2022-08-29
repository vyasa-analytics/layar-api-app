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
    public method: string = 'close matches';
    public cutoff: number = 0.85;
    public entityType: string = '';
    public entityTypes: Array<any> = [];
    public showAdvanced: boolean = false;
    public ontology: string;
    public stopWords: string;

    public groups: Array<Array<string>>;

    constructor(private layar: LayarService) { }

    public ngOnInit() {
        this.layar.populateConceptTypes().subscribe(() => {
            this.entityTypes = this.layar.conceptTypes;
        });
    }

    public onFindRadarTerms() {
        this.layar.requests.reset();
        this.loading = true;
        this.error = undefined;
        this.groups = [];

        const terms = this.text.split('\n').map(o => o.trim());
        const options: any = {};
        options.close_match_cutoff = this.cutoff;
        if (this.method === 'token ratio') {
            options.ner_tags = this.entityType ? [this.entityType] : undefined;
            options.ontology_ids = this.ontology ? [this.ontology] : undefined;
            const stopWords = (this.stopWords || '').split(',').map(o => o.trim()).filter(o => o);
            options.stopwords = stopWords?.length ? stopWords : undefined;
        }

        this.layar.groupTerms(terms, this.method, options).pipe(finalize(() => {
            this.loading = false;
        })).subscribe(groups => {
            this.groups = groups;
        }, error => {
            this.error = error || true;
        });
    }

    public onMethodChange() {
        this.entityType = '';
        this.showAdvanced = false;
        this.ontology = '';
        this.stopWords = '';
        if (this.method === 'close matches lev') {
            this.cutoff = 0.7;
        } else if (this.method === 'close matches') {
            this.cutoff = 0.85;
        }
    }
}
