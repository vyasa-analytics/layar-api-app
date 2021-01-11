import { Component } from '@angular/core';
import { finalize, mergeMap } from 'rxjs/operators';
import { Layar, LayarService } from '../layar.service';

@Component({
    selector: 'app-ner',
    templateUrl: './ner.component.html',
    styleUrls: ['./ner.component.scss'],
})
export class NerComponent {
    public loading: boolean = false;
    public error: any = undefined;

    public text: string = 'Coronavirus disease 2019 (COVID-19) is a respiratory illness (see list of symptoms ) caused by a virus called SARS-CoV-2. The main way the virus spreads is from person to person through respiratory droplets. You may also be able to get it by touching a surface or object that has the virus on it, and then touching your face, mouth, nose, or eyes.';

    public textComponents: Array<TextComponent>;
    public conceptTypes: Array<Layar.ConceptType>;

    constructor(private layar: LayarService) { }

    public onTagText() {
        this.layar.requests.reset();
        this.loading = true;
        this.error = undefined;

        this.textComponents = [];

        const text = this.text;
        this.layar.populateConceptTypes().pipe(mergeMap(() => {
            return this.layar.tagParagraph(text);
        }), finalize(() => {
            this.loading = false;
        })).subscribe(namedEntities => {
            this.textComponents = GenerateTextComponents(text, namedEntities, this.layar);
            this.conceptTypes = [...new Set(namedEntities.map(o => o.typeId))].map(typeId => {
                const index = this.layar.conceptTypeIndexById[typeId];
                return index >= 0 ? this.layar.conceptTypes[index] : undefined;
            }).filter(o => o).sort((a, b) => {
                const A = a.name.toLowerCase();
                const B = b.name.toLowerCase();
                return A < B ? -1 : (A > B ? 1 : 0);
            })
        }, error => { 
            this.error = error || true; 
        });
    }

    public index(conceptType: Layar.ConceptType): string {
        return `_${conceptType ? (this.layar.conceptTypeIndexById[conceptType.id] % 24) : ''}`;
    }
}

export interface FlattenedNamedEntity {
    concept: string;
    typeId: string;
    start: number;
    end: number;
}

export interface NamedEntityGroup {
    entities: Array<FlattenedNamedEntity>;
    start: number;
    end: number;
}

export interface TextComponent {
    text: string;
    conceptType?: ConceptType;
}

export interface ConceptType {
    id: string;
    name: string;
}

export function GenerateTextComponents(text: string, namedEntities: Array<Layar.NamedEntity>, layar: LayarService): Array<TextComponent> {
    namedEntities = namedEntities || [];

    // flatten the named entity list, one entry per substring
    const flattened: Array<FlattenedNamedEntity> = [];
    namedEntities.forEach(entity => {
        if (layar.conceptTypeIndexById[entity.typeId] === undefined) { return; }
        entity.pos.forEach(o => {
            flattened.push({
                concept: entity.concept,
                typeId: entity.typeId,
                start: o[0],
                end: o[1],
            });
        });
    });
    flattened.sort((a, b) => (a.start - b.start) || (b.end - a.end));

    // handle inner ranges by grouping overlapping ranges together
    let lastStartIndex = -1;
    const grouped: { [key: number]: NamedEntityGroup } = {};
    flattened.forEach(entry => {
        if (lastStartIndex < 0 || entry.end > grouped[lastStartIndex].end) {
            lastStartIndex = entry.start;
        }
        grouped[lastStartIndex] = grouped[lastStartIndex] || {
            entities: [],
            start: lastStartIndex,
            end: entry.end,
        };
        grouped[lastStartIndex].entities.push(entry);
    }, {});


    let textStart = 0;
    const textComponents: Array<TextComponent> = [];
    const indices: Array<number> = Object.keys(grouped).map(o => parseInt(o)).sort((a, b) => a - b);
    indices.forEach(key => {
        const group: NamedEntityGroup = grouped[key];
        if (textStart < group.start) {
            textComponents.push({ text: text.substring(textStart, group.start) });
        }

        const entity: FlattenedNamedEntity = group.entities[0];
        const conceptType: ConceptType = layar.conceptTypes[layar.conceptTypeIndexById[entity.typeId]];

        textComponents.push({
            text: text.substring(group.start, group.end),
            conceptType: conceptType,
        });
        textStart = group.end;
    });
    if (textStart < text.length) {
        textComponents.push({ text: text.substring(textStart) });
    }

    return textComponents;
}
