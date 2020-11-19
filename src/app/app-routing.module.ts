import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CompoundComponent } from 'example/compound/compound.component';
import { LayoutComponent } from 'src/app/layout/layout.component';
import { NerComponent } from 'example/ner/ner.component';
import { QaComponent } from 'example/qa/qa.component';
import { RadarComponent } from 'example/radar/radar.component';
import { SearchComponent } from 'example/search/search.component';
import { QaCustomComponent } from 'example/qa/qa-custom.component';
import { GroupingComponent } from 'example/grouping/grouping.component';
import { ToxicityPredictionComponent } from 'example/toxicity-prediction/toxicity-prediction.component';

const routes: Routes = [{
    path: '', component: LayoutComponent, children: [
        { path: 'compound', component: CompoundComponent },
        { path: 'grouping', component: GroupingComponent },
        { path: 'ner', component: NerComponent },
        { path: 'radar', component: RadarComponent },
        { path: 'search', component: SearchComponent },
        { path: 'toxicity', component: ToxicityPredictionComponent },
        { path: 'qa', component: QaComponent },
        { path: 'qa-custom', component: QaCustomComponent },
    ]
}];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule]
})
export class AppRoutingModule { }
