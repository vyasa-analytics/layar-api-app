import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/auth.service';
import { RequestObserverService } from 'src/app/common/request-observer.service';

@Injectable()
export class LayarService {
    private readonly dataProviders: Array<string> = ['master-pubmed.vyasa.com'];

    private headers(dataProviders: Array<string>): any {
        return dataProviders?.length ? { ['X-Vyasa-Data-Providers']: dataProviders.join(',') || undefined } : {};
    }

    constructor(private auth: AuthService, public requests: RequestObserverService) { }

    public findQuestion(queryString: string): Observable<Layar.Question> {
        return this.auth.POST(`/question/search`, {
            rows: '1',
            start: '0',
            queryStrings: [queryString],
            dataProviders: this.dataProviders,
        }, {}).pipe(map(response => {
            const questions: Array<Layar.Question> = response.body;
            return questions.shift();
        }));
    }

    public createQuestion(queryString: string): Observable<Layar.Question> {
        return this.auth.POST('/question', {}, this.headers(this.dataProviders), {
            queryString: queryString
        }).pipe(map(response => response.body));
    }

    public getQuestion(id: string): Observable<Layar.Question> {
        return this.auth.GET(`/question/${id}`, {}, {}).pipe(map(response => response.body));
    }

    public getAnswers(id: string, max: number, offset: number = undefined): Observable<Array<Layar.Answer>> {
        return this.auth.POST(`/answer/search`, {
            rows: String(max || 0),
            start: String(offset || 0),
            questionIds: [id],
            rejected: 'false',
            sort: 'passageRankingScore',
            sortOrder: 'desc',
        }, {}).pipe(map(response => response.body));
    }

    public findAnswersInCustomText(context: string, questions: Array<string>): Observable<Array<Layar.Answer>> {
        return this.auth.POST(`/question/ask`, {}, {}, {
            context: context,
            questions: questions,
        }).pipe(map(response => {
            console.log(response.body);
            return (response.body.answers || []).filter(o => o.best_prediction).map(o => {
                return {
                    id: o.id,
                    text: o.best_prediction,
                    evidence: [{ context: o.evidence_text } as Layar.AnswerEvidence]
                };
            });
        }));
    }

    public getConceptTypes(): Observable<Array<Layar.ConceptType>> {
        return this.auth.GET('/conceptType', {
            rows: '500'
        }, this.headers(['master-concepts.vyasa.com'])).pipe(map(response => response.body));
    }

    public tagParagraph(text: string, types: Array<string> = undefined): Observable<Array<Layar.NamedEntity>> {
        return this.auth.POST('/namedEntity/tag', {}, {}, {
            text: text,
            types: types,
        }).pipe(map(response => {
            return response.body.namedEntities;
        }));
    }

    public getRadarTerms(search: string, max: number, offset: number = undefined): Observable<Array<Layar.RadarTerm>> {
        return this.auth.GET("/radar", {
            terms: [search],
            rows: String(max || 0),
            start: String(offset || 0),
            sort: 'similarity',
            sortOrder: 'desc'
        }, this.headers(this.dataProviders)).pipe(map(response => response.body));
    }

    public getSourceDocuments(search: string, max: number, offset: number = undefined): Observable<Array<Layar.SourceDocument>> {
        return this.auth.POST('/sourceDocument/search', {}, this.headers(this.dataProviders), {
            q: search,
            rows: String(max || 0),
            start: String(offset || 0),
            sort: 'cortexRelevanceScore',
            sortOrder: 'desc',
            sourceFields: ['name', 'datePublished', 'summary', 'documentURI']
        }).pipe(map(response => response.body));
    }

    public renderCompoundToSVG(smilesString: string, height: number, width: number): Observable<string> {
        return this.auth.GET('/compound/render', {
            smilesString: smilesString,
            height: `${height}`,
            width: `${width}`
        }, { 'Accept': 'text/plain' }).pipe(map(response => response.body));
    }

    public groupTerms(terms: Array<string>, cutoff: number = 0.9): Observable<Array<Array<string>>> {
        return this.auth.POST('/group/terms', {}, {}, { terms: terms, grouping_params: { close_match_cutoff: cutoff } }).pipe(map(response => {
            return response.body;
        }));
    }

    public getTox21AnalysisSOM(smiles: Array<string>): Observable<Layar.SelfOrganizingMap> {
        return this.auth.POST('/smiles/createTox21SOM', {}, {}, { smiles: smiles }).pipe(map(response => {
            return response.body; 
        }));
    }
}

export module Layar {
    export interface Question {
        id: string;
        complete: boolean;
        queryString: string;
        dataProviders: string;
    }

    export interface Answer {
        id: string;
        text: string;
        evidence: Array<AnswerEvidence>;
    }

    export interface AnswerEvidence {
        name: string; // document's name
        documentURI: string;
        documentId: string;
        provider: string;
        context: string;
        answerRankingScore: number;
        passageRankingScore: number;
        startOffset: number;
        endOffset: number;
        namedEntities: Array<NamedEntity>;
    }

    export interface NamedEntity {
        pos: Array<Array<number>>
        concept: string;
        typeId: string;
    }

    export interface ConceptType {
        id: string;
        name: string;
    }

    export interface RadarTerm {
        term: string;
        similarity: number;
        trendScore: number;
    }

    export interface SourceDocument {
        id: string;
        dateIndexed: string;
        datePublished: string;
        cortexDocumentType: string;
        name: string;
        createdByUser: number;
        url: string;             // cortex URL
        documentURI: string;     // originating document URL
        metadata: SourceDocumentMetadata;
        mimeType: string;
        summary: string;
        thumbnailAvailable: boolean;
        structuredData: Array<any>;
        rawText: string;
        provider: string;
        source: string;
    }

    export interface SourceDocumentMetadata {
        title?: string;
        [key: string]: any;
    }

    export interface SelfOrganizingMap {
        histogram: Array<Array<number>>;
        compounds: Array<Array<Array<string>>>;
        umatrix: Array<Array<number>>;
        neuralNet: Array<Array<Array<number>>>;
        maxHits: number;
    }
}