import { BehaviorSubject, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Layar, LayarService } from '../layar.service';

export class QaStore {
    public question: Layar.Question;
    public answers: Array<Layar.Answer> = [];
    public complete = new BehaviorSubject<boolean>(false);
    public error: any = undefined;

    constructor(private layar: LayarService) { }

    public askQuestion(queryString: string) {
        this.layar.findQuestion(queryString).pipe(mergeMap(question => {
            if (question) { return of(question); }
            return this.layar.createQuestion(queryString);
        })).subscribe(question => {
            this.question = question;
            this.pollForCompletionStatus();
            this.pollForAnswers();
        }, error => {
            this.error = error || true;
        });
    }

    // Keep polling for completion until the question is marked complete
    private pollForCompletionStatus() {
        if (this.question.complete) { return; }

        this.layar.getQuestion(this.question.id).subscribe(question => {
            this.question = question;
            setTimeout(() => this.pollForCompletionStatus(), 3000);
        }, error => {
            this.error = error || true;
        });
    }

    // Keep polling for answers until the question is marked complete
    private pollForAnswers() {
        if (!this.question || this.complete.value) { return; }

        const complete = this.question.complete;
        this.layar.getAnswers(this.question.id, 30, 0).subscribe(answers => { 
            this.answers = answers;
            if (complete) { this.complete.next(true); }
            setTimeout(() => this.pollForAnswers(), 3000);
        }, error => {
            this.error = error || true;
        });
    }
}
