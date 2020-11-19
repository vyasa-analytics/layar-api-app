import { Component, OnInit, Input } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Layar } from '../../layar.service';

@Component({
    selector: 'app-evidence',
    templateUrl: './evidence.component.html',
    styleUrls: ['./evidence.component.scss']
})
export class EvidenceComponent implements OnInit {
    @Input()
    public text: string;

    @Input()
    public evidence: Layar.AnswerEvidence;

    public context: SafeHtml;

    constructor(private sanitizer: DomSanitizer) { }

    public ngOnInit() {
        // mark textual matches within the context
        const indices: Array<number> = [];
        const search = this.text.toLowerCase();
        const source = this.evidence.context.toLowerCase();
        let index = -1;
        do {
            index = source.indexOf(search, index + 1);
            if (index >= 0) { indices.push(index); }
        } while (index >= 0);

        let context = this.evidence.context;
        for (let i = indices.length - 1; i >= 0; i--) {
            const start = indices[i];
            const end = start + search.length;
            context = `${context.substring(0, start)}<span class="match">${context.substring(start, end)}</span>${context.substring(end)}`;
        }

        this.context = this.sanitizer.bypassSecurityTrustHtml(context);
    }
}
