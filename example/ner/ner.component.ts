import { Component } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Observable, of } from 'rxjs';
import { finalize, map, mergeMap } from 'rxjs/operators';
import { Layar, LayarService } from '../layar.service';

let ConceptTypes: Array<Layar.ConceptType>;
let ConceptTypeIndexById: { [key: string]: number } = {};

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
    public html: SafeHtml;

    constructor(private layar: LayarService, private sanitizer: DomSanitizer) { }

    public onTagText() {
        this.layar.requests.reset();
        this.loading = true;
        this.error = undefined;

        this.textComponents = [];

        const text = this.text;
        this.populateConceptTypes().pipe(mergeMap(() => {
            return this.layar.tagParagraph(text);
        }), finalize(() => {
            this.loading = false;
        })).subscribe(namedEntities => {
            this.textComponents = GenerateTextComponents(text, namedEntities);
            this.conceptTypes = [...new Set(namedEntities.map(o => o.typeId))].map(typeId => {
                const index = ConceptTypeIndexById[typeId];
                return index >= 0 ? ConceptTypes[index] : undefined;
            }).filter(o => o).sort((a, b) => {
                const A = a.name.toLowerCase();
                const B = b.name.toLowerCase();
                return A < B ? -1 : (A > B ? 1 : 0);
            });

            const html = TagParagraph(this.textComponents);
            this.html = this.sanitizer.bypassSecurityTrustHtml(html);
        }, error => {
            this.error = error || true;
        });
    }

    public index(conceptType: Layar.ConceptType): string {
        return `_${conceptType ? (ConceptTypeIndexById[conceptType.id] % 24) : ''}`;
    }

    private populateConceptTypes(): Observable<void> {
        // this request doesn't need to be performed with each tagging.
        // if (ConceptTypes) { return of(true).pipe(map(() => { })); }

        return this.layar.getConceptTypes().pipe(map(conceptTypes => {
            ConceptTypes = conceptTypes;
            conceptTypes.forEach((conceptType, index) => {
                ConceptTypeIndexById[conceptType.id] = index;
            })
        }));
    }
}

export interface FlattenedNamedEntity {
    concept: string;
    typeId: string;
    start: number;
    end: number;
    depth: number;
}

export interface NamedEntityGroup {
    entities: Array<FlattenedNamedEntity>;
    start: number;
    end: number;
}

export interface TextComponent {
    text: string;
    start?: number;
    end?: number;
    conceptType?: ConceptType;
    conceptList?: Array<FlattenedNamedEntity>;
}

export interface ConceptType {
    id: string;
    name: string;
}

export function GenerateTextComponents(text: string, namedEntities: Array<Layar.NamedEntity>): Array<TextComponent> {
    namedEntities = namedEntities || [];

    // flatten the named entity list, one entry per substring
    const flattened: Array<FlattenedNamedEntity> = [];
    namedEntities.forEach(entity => {
        if (ConceptTypeIndexById[entity.typeId] === undefined) { return; }
        entity.pos.forEach(o => {
            flattened.push({
                concept: entity.concept,
                typeId: entity.typeId,
                start: o[0],
                end: o[1],
                depth: -1,
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
        const conceptType: ConceptType = ConceptTypes[ConceptTypeIndexById[entity.typeId]];

        CalculateDepthForGroup(group);

        textComponents.push({
            text: text.substring(group.start, group.end),
            start: group.start,
            end: group.end,
            conceptType: conceptType,
            conceptList: group.entities,
        });
        textStart = group.end;
    });
    if (textStart < text.length) {
        textComponents.push({ text: text.substring(textStart) });
    }

    return textComponents;
}

interface TreeNode {
    entity: FlattenedNamedEntity;
    parent: TreeNode;
    children: Array<TreeNode>;
}

export function CalculateDepthForGroup(group: NamedEntityGroup) {
    const root: TreeNode = { entity: undefined, parent: undefined, children: [] };

    // build a tree from the overlap of the entities
    let node: TreeNode = root;
    group.entities.forEach(entity => {
        while (node.parent && entity.end > node.entity.end) { node = node.parent; }
        let child: TreeNode = { entity: entity, parent: node, children: [] };
        node.children.push(child);
        node = child;
    });

    // find the max height of the tree
    let max = 0;
    traverse(root, (_, level) => { max = Math.max(max, level); });

    // the depth of each entity is the inverse of its level in the tree
    traverse(root, (node, level) => {
        if (!node.entity) { return; }
        node.entity.depth = max - level;
    });
}

function traverse(node: TreeNode, callback: (node: TreeNode, level: number) => void, level: number = 0) {
    callback(node, level);
    node.children.forEach(child => traverse(child, callback, level + 1));
}

export function TextComponentsToHtml(textComponents: Array<TextComponent>): string {
    textComponents = textComponents || [];

    let conceptTypeIds = new Set<string>();
    const result = textComponents.map(item => {
        if (!item.conceptList?.length) { return item.text; }
        item.conceptList.forEach(entity => conceptTypeIds.add(entity.typeId));

        const conceptTypes: Array<ConceptType> = []
        item.conceptList.forEach(entity => {
            const conceptType = ConceptTypes[ConceptTypeIndexById[entity.typeId]];
            if (!conceptType || conceptTypes.find(o => o.id === conceptType.id)) { return; }
            conceptTypes.push(conceptType);
        });

        const maxDepth = Math.max(...item.conceptList.map(o => o.depth));
        return `` +
            `<span class="concept-container" style="margin: 0px ${maxDepth + 1}px">` +
            item.conceptList.map((entity, i) => {
                const start = entity.start - item.start || 0;
                const end = entity.end - item.start;
                const pre: string = item.text.substring(0, start);
                const mid: string = item.text.substring(start, end);

                const index = ConceptTypeIndexById[entity.typeId];
                const color: string = `${index >= 0 ? ' _' + (index % 24) : ''}`;
                const toggle: string = `${index >= 0 ? ' __' + (index) : ''}`;
                const depth: string = ` p${entity.depth + 1}`;

                return `<div class="float"><span class="no-touch">${pre}</span><span class="concept${color}${toggle}${depth}">${mid}</span></div>`;
            }).join('') +
            `<span class="text">` +
            item.text +
            `<div class="hover-container" style="top: calc(100% + ${maxDepth + 2}px); left: -${maxDepth + 1}px">` +
            conceptTypes.map(conceptType => {
                const index = ConceptTypeIndexById[conceptType.id];
                const color: string = `${index >= 0 ? ' _' + (index % 24) : ''}`;
                const toggle: string = `${index >= 0 ? ' __' + (index) : ''}`;
                return `<div class="hover-text${color}${toggle}">${conceptType.name}</div>`;
            }).join('') +
            `</div>` +
            `</span>` +
            `</span>`;
    }).join('');

    return result;
}

export function TagParagraph(namedEntities: Array<TextComponent>): string {
    return TextComponentsToHtml(namedEntities);
}
