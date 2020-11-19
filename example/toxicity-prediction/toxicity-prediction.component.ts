import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { finalize } from 'rxjs/operators';
import { Layar, LayarService } from '../layar.service';

@Component({
    selector: 'app-toxicity-prediction',
    templateUrl: './toxicity-prediction.component.html',
    styleUrls: ['./toxicity-prediction.component.scss'],
})
export class ToxicityPredictionComponent {
    public loading: boolean = false;
    public error: any = undefined;

    public text: string = '' +
        'CCCCCCCCCCCCCCCO\n' +
        'O=P([O-])([O-])OC1C(O)C(O)C(O)C(O)C1O\n' +
        'O=C1c2ccc(O)cc2OCC1c1ccc(O)cc1O\n' +
        'COc1ccc(-c2cc(=O)c3c(O)cc([O-])cc3o2)cc1\n' +
        '[O-]c1c(Cl)c(Cl)c(Cl)c(Cl)c1Cl\n' +
        'C=C(C)C1CCC2(C1)C(C)=CC(O)CC2C\n' +
        'COc1cc2c(cc1O)C1Cc3ccc4c(c3CN1CC2)OCO4\n' +
        '[NH3+]C(CC1C=CC(O)CC1)C(=O)[O-]\n' +
        'C1CC[NH2+]CC1\n' +
        '[O-]c1c(O)c(Cl)cc(Cl)c1Cl\n' + 
        '[O-][n+]1ccccc1\n' +
        'C[NH2+]C(C)C(O)c1ccccc1\n' +
        'CC12CCC3c4ccc(O)cc4C(O)CC3C1CCC2O\n' +
        'Oc1cc(O)cc(CCc2ccccc2)c1';

    public submitted: boolean = false;
    public som: Layar.SelfOrganizingMap;

    constructor(private layar: LayarService, private sanitizer: DomSanitizer) { }

    public onRender() {
        this.layar.requests.reset();
        this.loading = true;
        this.error = undefined;

        this.submitted = true;
        this.som = undefined;

        const smiles = this.text.split('\n').map(o => o.trim()).filter(o => o);
        this.layar.getTox21AnalysisSOM(smiles).pipe(finalize(() => {
            this.loading = false;
        })).subscribe(som => {
            this.som = som;
        }, error => {
            this.error = error || true;
        });
    }
}
