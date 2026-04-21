import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    HostListener,
    ViewChild,
    inject
} from '@angular/core';
import * as d3 from 'd3';
import { FeatureCollectionType, GeoService } from 'src/app/services/geo.service';
import { MapaLogicService } from 'src/app/services/mapa-logic.service';
import { MapaStateService } from 'src/app/services/mapa-state.service';

@Component({
    selector: 'jmp-mapa',
    imports: [CommonModule],
    templateUrl: './mapa.html',
    styleUrl: './mapa.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Mapa implements AfterViewInit {

    @ViewChild('svg', { static: true })
    svgRef!: ElementRef<SVGSVGElement>;

    private geo = inject(GeoService);
    private logic = inject(MapaLogicService);
    private state = inject(MapaStateService);

    private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    private root!: d3.Selection<SVGGElement, unknown, null, undefined>;
    private paths!: d3.Selection<SVGGElement, unknown, null, undefined>;
    private labels!: d3.Selection<SVGGElement, unknown, null, undefined>;

    private data!: FeatureCollectionType;
    private projection!: d3.GeoProjection;
    private path!: d3.GeoPath<any, any>;

    private zoom: any;
    private transform = d3.zoomIdentity;

    private width = 1;
    private height = 1;

    ngAfterViewInit() {
        this.init();

        this.geo.load().subscribe((d) => {
            this.data = d;
            this.render();
        });
    }

    @HostListener('window:resize')
    resize() {
        if (this.data) this.render();
    }

    private init() {
        this.svg = d3.select(this.svgRef.nativeElement);
        this.root = this.svg.append('g');
        this.paths = this.root.append('g');
        this.labels = this.root.append('g');
    }

    private render() {
        const rect = this.svgRef.nativeElement.getBoundingClientRect();
        this.width = rect.width || 1;
        this.height = rect.height || 1;

        this.svg.attr('viewBox', `0 0 ${this.width} ${this.height}`);

        this.projection = d3.geoMercator().fitSize([this.width, this.height], this.data);
        this.path = d3.geoPath(this.projection);

        this.drawPaths();
        this.setupZoom();
    }

    private drawPaths() {
        this.paths
            .selectAll('path')
            .data(this.data.features)
            .join('path')
            .attr('d', (d: any) => this.path(d))
            .attr('fill', '#ddd')
            .attr('stroke', '#333')
            .attr('stroke-width', 0.5)

            .on('mouseenter', (e, d) => {
                this.state.hover$.next(d.properties);
                d3.select(e.currentTarget).attr('fill', '#bbb');
            })
            .on('mouseleave', (e) => {
                this.state.hover$.next(null);
                d3.select(e.currentTarget).attr('fill', '#ddd');
            })
            .on('mousemove', (e) => {
                this.state.mouse$.next({ x: e.clientX, y: e.clientY });
            })

            .on('click', (_e: any, d: any) => {
                this.state.selected$.next(d.properties);
                // console.log(d.properties);
                alert(d.properties.name);
            });
    }

    private setupZoom() {
        if (this.zoom) return;

        this.zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([1, 40])
            .on('zoom', (e: any) => {

                this.transform = e.transform;
                this.root.attr('transform', e.transform);

                const k = e.transform.k;

                // línies consistents
                this.paths.selectAll('path')
                    .attr('stroke-width', 0.5 / k);

                this.renderLabels(k);
                this.updateCenter();
            });

        this.svg.call(this.zoom);
    }

    private renderLabels(k: number) {

        if (k < 15) {
            this.labels.selectAll('text').remove();
            return;
        }

        const centerScreen: [number, number] = [this.width / 2, this.height / 2];

        const radius = Math.min(this.width, this.height) * 0.25;

        const visibles = this.data.features.filter((f: any) => {
            const c = this.path.centroid(f);
            if (!isFinite(c[0]) || !isFinite(c[1])) return false;

            const cScreen = this.transform.apply(c);

            const dx = cScreen[0] - centerScreen[0];
            const dy = cScreen[1] - centerScreen[1];

            return (dx * dx + dy * dy) < (radius * radius);
        });

        const size = 10 / k;

        this.labels
            .selectAll('text')
            .data(visibles)
            .join('text')
            .attr('x', (d: any) => this.path.centroid(d)[0])
            .attr('y', (d: any) => this.path.centroid(d)[1])
            .text((d: any) => d.properties.nom || d.properties.name)
            .attr('text-anchor', 'middle')
            .attr('pointer-events', 'none')
            .attr('font-size', `${size}px`);
    }

    private updateCenter() {
        const center = this.logic.getCenterFeature(
            this.data,
            this.path,
            this.transform,
            this.width,
            this.height
        );

        if (center) {
            this.state.center$.next(center.properties);
        }
    }
}
