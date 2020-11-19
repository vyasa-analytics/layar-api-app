import { Component } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { finalize } from 'rxjs/operators';
import { LayarService } from '../layar.service';

@Component({
    selector: 'app-compound',
    templateUrl: './compound.component.html',
    styleUrls: ['./compound.component.scss'],
})
export class CompoundComponent {
    public loading: boolean = false;
    public error: any = undefined;

    public text: string = 'CC(=O)NCCC1=CNc2c1cc(OC)cc2CC(=O)NCCc1c[nH]c2ccc(OC)cc12';

    public submitted: boolean = false;
    public svg: SafeHtml;

    constructor(private layar: LayarService, private sanitizer: DomSanitizer) { }

    public onRender() {
        this.layar.requests.reset();
        this.loading = true;
        this.error = undefined;
        this.submitted = true;
        this.svg = undefined;
        this.layar.renderCompoundToSVG(this.text, 288, 288).pipe(finalize(() => {
            this.loading = false;
        })).subscribe(svg => {
            this.svg = this.sanitizer.bypassSecurityTrustHtml(svg);
        }, error => {
            this.error = error || true;
        });
    }
}
