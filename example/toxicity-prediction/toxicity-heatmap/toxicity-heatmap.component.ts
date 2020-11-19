import { Component, OnInit, Input, ElementRef } from '@angular/core';
import { Layar } from 'example/layar.service';
import { Selection, BaseType } from 'd3-selection';

import * as d3base from 'd3';
import * as d3hexbin from 'd3-hexbin';
const d3: typeof d3base & typeof d3hexbin = Object.assign(d3base, d3hexbin);

@Component({
    selector: 'app-toxicity-heatmap',
    templateUrl: './toxicity-heatmap.component.html',
    styleUrls: ['./toxicity-heatmap.component.scss'],
})
export class ToxicityHeatmapComponent implements OnInit {
    @Input()
    public som: Layar.SelfOrganizingMap;

    public selected: Array<string> = [];

    private svg: Selection<HTMLElement, any, null, undefined>;
    private nativeElement: any;

    constructor(element: ElementRef) {
        this.nativeElement = element.nativeElement;
    }

    public ngOnInit() {
        this.svg = d3
            .select(this.nativeElement)
            .select('svg#hexmap');
        this.buildHexMap();
    }

    private buildHexMap(): void {
        const histogram = this.som.histogram;
        const compounds = this.som.compounds;
        const umatrix = this.som.umatrix;
        const neuralNet = this.som.neuralNet;
        const maxHits = this.som.maxHits;

        const mouseover = function (d) {
            if (d[0].count > 0) {
                if (d.oldOpacity === null || d.oldOpacity === undefined) {
                    d.oldOpacity = d3.select(this).style('fill-opacity');
                    d.oldFill = d3.color(d3.select(this).style('fill'));
                }
                const el = d3
                    .select(this)
                    .transition()
                    .duration(10)
                    .style('fill-opacity', 1)
                    .style('fill', d.oldFill.darker(0.4));
            }
        };
        const mouseout = function (d) {
            if (d.oldOpacity) {
                const el = d3
                    .select(this)
                    .transition()
                    .duration(1000)
                    .style('fill-opacity', d.oldOpacity)
                    .style('fill', d.oldFill)
                    .on('end', () => {
                        d.oldOpacity = null;
                        d.oldFill = null;
                    });
            }
        };

        const margin = { top: 0, right: 0, bottom: 0, left: 0 };

        // THE NUMBER OF COLS AND ROWS OF THE HEXMAP
        const MapColumns = histogram[0].length;
        const MapRows = histogram.length;

        // HEX SIZE
        const hexRadius = 26;
        const hexHeight = hexRadius * 2;
        const hexWidth = hexHeight / (2 / Math.sqrt(3));

        const totalHexWidth = (MapColumns + 0.5) * hexWidth;
        const totalHexHeight =
            MapRows * hexRadius * 1.5 +
            Math.sqrt(Math.pow(hexRadius, 2) - Math.pow(hexWidth / 2, 2));

        const svgWidth = totalHexWidth + margin.left + margin.right;
        const svgHeight = totalHexHeight + margin.top + margin.bottom;

        const firstHexOffset = {
            x: hexWidth + margin.left,
            y: margin.top + hexHeight / 2,
        };

        // CALCULATE THE CENTER POSITIONS OF EACH HEXAGON
        const points = [];
        for (let i = 0; i < MapRows; i++) {
            for (let j = 0; j < MapColumns; j++) {
                let a;
                const b = (3 * i * hexRadius) / 2;
                if (i % 2 === 0) {
                    a = Math.sqrt(3) * j * hexRadius;
                } else {
                    a = Math.sqrt(3) * (j - 0.5) * hexRadius;
                }
                points.push({
                    xPos: a,
                    yPos: b,
                    compounds: compounds[i][j],
                    count: histogram[i][j],
                    distance: umatrix[i][j],
                    weights: neuralNet[i][j],
                });
            }
        }

        // SET THE HEXAGON RADIUS
        const hexbin = d3
            .hexbin()
            .radius(hexRadius)
            .x((d: any) => d.xPos)
            .y((d: any) => d.yPos);

        const radius = d3
            .scaleSqrt()
            .domain([0, 1, maxHits])
            .range([2, hexRadius, hexRadius]);

        const opacity = d3
            .scaleSqrt()
            .domain([0, 1, maxHits])
            .range([1, 0.5, 0]);

        // SET THE SVG SIZE
        this.svg.attr('width', svgWidth).attr('height', svgHeight);

        let g = this.svg.select('g');
        if (g.empty()) {
            g = this.svg.append('g');
        }
        g.attr(
            'transform',
            'translate(' + firstHexOffset.x + ',' + firstHexOffset.y + ')',
        );

        // BUILD HEXAGONS
        const hexagons = g.selectAll('.hexagon').data(hexbin(points));
        const hexEnter: Selection<BaseType, any, any, any> = hexagons
            .enter()
            .append('path')
            .attr('class', 'hexagon')
            .classed('empty', (d: any) => d[0].count === 0)
            .style('fill', (d: any, i: number) => {
                if (d[0].count > 0) {
                    const colors = [];
                    const numWeights = d[0].weights.length;
                    for (const idx in d[0].weights) {
                        if (idx) {
                            const weight = d[0].weights[idx];
                            let offset = (+idx + 1) / numWeights;
                            offset = 1;
                            colors.push(
                                d3.color(d3.interpolateSpectral(weight)),
                            );
                        }
                    }
                    colors.push(
                        d3.color(d3.interpolateSpectral(d[0].distance)),
                    );
                    return d3.interpolateSpectral(
                        1.0 -
                            (0.0 +
                                d[0].weights.reduce((pv, cv) => pv + cv, 0)) /
                                (0.0 + numWeights),
                    );
                }
                return null;
            })
            .style('fill-opacity', (d: any, i: number) => {
                if (d[0].count > 0) {
                    return 1 - opacity(d[0].count);
                }
                return null;
            });
        hexEnter
            .merge(hexagons)
            .on('mouseover', mouseover)
            .on('mouseout', mouseout)
            .on('click', (d: any) => this.selected = [...d[0].compounds])
            .attr('d', (d: any) => `M${d.x},${d.y}${hexbin.hexagon(radius(d[0].count))}`);


        // BUILD LEGEND
        const legend = d3.select('svg#legend').attr('width', svgWidth);
        let gradient = legend.select('defs');
        if (gradient.empty()) {
            gradient = legend
                .append('defs')
                .append('linearGradient')
                .attr('id', 'gradient')
                .attr('x1', '0%')
                .attr('y1', '0%')
                .attr('x2', '100%')
                .attr('y2', '0%')
                .attr('spreadMethod', 'pad');

            const gradientColors = [];
            for (let i = 0; i < 100; i++) {
                gradientColors.push([
                    i + '%',
                    d3.color(d3.interpolateSpectral(i / 100)),
                ]);
            }

            gradientColors.forEach((d) => {
                gradient
                    .append('stop')
                    .attr('offset', d[0])
                    .attr('stop-color', d[1])
                    .attr('stop-opacity', 0.8);
            });
        }

        const box = legend.selectAll('rect').data([
            {
                x1: 0,
                y1: 0,
                width: totalHexWidth,
                offset: margin.left,
            },
        ]);
        const boxEnter: Selection<BaseType, any, any, any> = box
            .enter()
            .append('rect')
            .style('fill', 'url(#gradient)')
            .attr('height', 10);
        boxEnter
            .merge(box)
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('width', (d) => d.width)
            .attr('transform', (d) => `translate(${d.offset},0)`);

        const labels = legend.selectAll('text').data([
            { x: margin.left, y: 30, text: 'Toxic', textAnchor: 'start' },
            {
                x: svgWidth - margin.right,
                y: 30,
                text: 'Non-Toxic',
                textAnchor: 'end',
            },
        ]);
        const labelEnter: Selection<BaseType, any, any, any> = labels
            .enter()
            .append('text')
            .attr('y', (d) => d.y);
        labelEnter
            .merge(labels)
            .text((d) => d.text)
            .attr('x', (d) => d.x)
            .attr('text-anchor', (d) => d.textAnchor);
    }
}
