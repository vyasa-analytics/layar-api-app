import { Component } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { Layar, LayarService } from '../layar.service';

@Component({
    selector: 'app-qa-custom',
    templateUrl: './qa-custom.component.html',
    styleUrls: ['./qa-custom.component.scss'],
})
export class QaCustomComponent {
    public loading: boolean = false;
    public error: any = undefined;

    public question: string = 'What are symptoms of covid-19?';
    public paragraph: string = 'COVID-19 is a new pandemic disease whose pathophysiology and clinical description are still not completely defined. Besides respiratory symptoms and fever, gastrointestinal (GI) symptoms (including especially anorexia, diarrhea, and abdominal pain) represent the most frequent clinical manifestations.';

    public answers: Array<Layar.Answer>;

    constructor(private layar: LayarService) { }

    public onAnswerQuestion() {
        this.layar.requests.reset();
        this.loading = true;
        this.error = undefined;

        this.answers = [];
        this.layar.findAnswersInCustomText(this.paragraph, [this.question]).pipe(finalize(() => {
            this.loading = false;
        })).subscribe(answers => {
            this.answers = answers;
        }, error => {
            this.error = error || true;
        });
    }
}
