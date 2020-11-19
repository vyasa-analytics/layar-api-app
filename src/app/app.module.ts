import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LayoutComponent } from './layout/layout.component';
import { QaComponent } from 'example/qa/qa.component';
import { QaCustomComponent } from 'example/qa/qa-custom.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from './auth/auth.service';
import { LayarService } from 'example/layar.service';
import { HttpClientModule } from '@angular/common/http';
import { ErrorComponent } from './common/error.component';
import { LoadingIndicatorComponent } from './common/loading-indicator.component';
import { EvidenceComponent } from 'example/qa/evidence/evidence.component';
import { NerComponent } from 'example/ner/ner.component';
import { RadarComponent } from 'example/radar/radar.component';
import { SearchComponent } from 'example/search/search.component';
import { CompoundComponent } from 'example/compound/compound.component';
import { GroupingComponent } from 'example/grouping/grouping.component';
import { ToxicityPredictionComponent } from 'example/toxicity-prediction/toxicity-prediction.component';
import { ToxicityHeatmapComponent } from 'example/toxicity-prediction/toxicity-heatmap/toxicity-heatmap.component';
import { RequestObserverComponent } from './common/request-observer.component';
import { RequestObserverService } from './common/request-observer.service';

@NgModule({
    declarations: [
        AppComponent,
        CompoundComponent,
        ErrorComponent,
        EvidenceComponent,
        GroupingComponent,
        LayoutComponent,
        LoadingIndicatorComponent,
        NerComponent,
        QaComponent,
        QaCustomComponent,
        RadarComponent,
        RequestObserverComponent,
        SearchComponent,
        SidebarComponent,
        ToxicityHeatmapComponent,
        ToxicityPredictionComponent,
    ],
    imports: [
        AppRoutingModule,
        BrowserModule,
        FormsModule,
        HttpClientModule,
        ReactiveFormsModule,
    ],
    providers: [
        AuthService,
        LayarService,
        RequestObserverService,
    ],
    bootstrap: [
        AppComponent
    ],
})
export class AppModule { }
