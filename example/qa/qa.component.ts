import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { LayarService } from '../layar.service';
import { QaStore } from './qa.store';

@Component({
    selector: 'app-qa',
    templateUrl: './qa.component.html',
    styleUrls: ['./qa.component.scss'],
})
export class QaComponent {
    public loading: boolean = false;

    public question: string = 'What are symptoms of covid-19?';

    public store: QaStore;
    private subscription: Subscription;

    constructor(private layar: LayarService) { }

    public onAnswerQuestion() {
        this.layar.requests.reset();
        this.loading = true;
        this.store = new QaStore(this.layar);
        this.store.askQuestion(this.question);
        this.subscription?.unsubscribe();
        this.subscription = this.store.complete.subscribe(() => {
            if (!this.store.complete.value) { return; }
            this.loading = false;
        });
    }
}
