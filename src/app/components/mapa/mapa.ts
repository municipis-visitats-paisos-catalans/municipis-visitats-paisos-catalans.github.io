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
import { MainService } from 'src/app/services/main.service';
import { MapaStateService } from 'src/app/services/mapa-state.service';
import { Utils } from 'src/app/shared/utils';

@Component({
    selector: 'jmp-mapa',
    imports: [CommonModule],
    templateUrl: './mapa.html',
    styleUrl: './mapa.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Mapa implements AfterViewInit {

    @ViewChild('canvas', { static: true })
    canvasRef!: ElementRef<HTMLCanvasElement>;

    private geo = inject(GeoService);
    private state = inject(MapaStateService);

    private ctx!: CanvasRenderingContext2D;

    private data!: FeatureCollectionType;
    private projection!: d3.GeoProjection;
    private path!: d3.GeoPath<any, any>;

    private zoom: any;
    private transform = d3.zoomIdentity;

    private width = 1;
    private height = 1;

    private pathsCache: Path2D[] = [];
    private centroids: [number, number][] = [];

    constructor(private m: MainService) { }

    ngAfterViewInit() {
        const canvas = this.canvasRef.nativeElement;
        this.ctx = canvas.getContext('2d')!;

        this.geo.load().subscribe((d) => {
            this.data = d;
            this.render();
            this.buildCache();
            this.setupZoom();

            const saved = this.loadTransform();

            if (saved) {
                this.transform = saved;
                d3.select(canvas).call(this.zoom.transform, saved);
            } else {
                const initialTransform = d3.zoomIdentity
                    .translate(-48.66, -397.48)
                    .scale(2.01);

                this.transform = initialTransform;
                d3.select(canvas).call(this.zoom.transform, initialTransform);
            }

            this.setupClick();
            this.draw();
        });
    }

    @HostListener('window:resize')
    resize() {
        if (!this.data) return;
        this.render();
        this.buildCache();
        this.draw();
    }

    private render() {
        const canvas = this.canvasRef.nativeElement;
        const rect = canvas.getBoundingClientRect();

        this.width = rect.width || 1;
        this.height = rect.height || 1;

        canvas.width = this.width;
        canvas.height = this.height;

        this.projection = d3.geoMercator().fitSize([this.width, this.height], this.data);
        this.path = d3.geoPath(this.projection);
    }

    private buildCache() {
        this.pathsCache = new Array(this.data.features.length);
        this.centroids = new Array(this.data.features.length);

        for (let i = 0; i < this.data.features.length; i++) {
            const f = this.data.features[i];

            const d = this.path(f);
            this.pathsCache[i] = new Path2D(d || '');

            const c = this.path.centroid(f);
            this.centroids[i] = [c[0], c[1]];
        }
    }

    private setupZoom() {
        const canvas = this.canvasRef.nativeElement;

        this.zoom = d3.zoom<HTMLCanvasElement, unknown>()
            .scaleExtent([1, 100])
            .on('zoom', (e: any) => {
                this.transform = e.transform;
                this.saveTransform();
                this.draw();
            });

        d3.select(canvas).call(this.zoom);
    }

    private draw() {
        const ctx = this.ctx;
        const { x, y, k } = this.transform;

        ctx.clearRect(0, 0, this.width, this.height);

        ctx.save();
        ctx.setTransform(k, 0, 0, k, x, y);

        ctx.lineWidth = 0.5 / k;

        const zonaCentre = this.getCenterZona();

        let hslUnvisited: string;
        let hslVisited: string;
        let hslStroke: string;

        if (Utils.darkMode) {
            hslUnvisited = '219, 0%, 100%'; // 219, 0%, 100%)
            hslVisited = '50, 100%, 50%';  // hsl(50, 100%, 50%)
            hslStroke = '0, 0%, 85%';   // hsl(0, 0%, 85%)
        } else {
            hslUnvisited = '50, 0%, 100%'; // hsl(50, 100%, 100%)
            hslVisited = '50, 100%, 50%';  // hsl(50, 100%, 50%)
            hslStroke = '0, 0%, 85%';   // hsl(0, 0%, 85%)
        }

        for (let i = 0; i < this.pathsCache.length; i++) {
            const p = this.pathsCache[i];
            const f = this.data.features[i];
            const zona = f.properties['zona'];

            const isSelected = false//(i % 7 === 0); // TEST

            const isInactive = zonaCentre && zona !== zonaCentre;
            const alpha = isInactive ? 0.3 : 1;

            const fillHsl = isSelected ? hslVisited : hslUnvisited;

            ctx.fillStyle = `hsla(${fillHsl}, ${alpha})`;
            ctx.strokeStyle = `hsla(${hslStroke}, ${isInactive ? 0 : 1})`;

            ctx.fill(p);
            ctx.stroke(p);
        }

        this.drawLabels();

        ctx.restore();
    }

    private getCenterZona(): string | null {
        const centerScreen: [number, number] = [this.width / 2, this.height / 2];

        let bestIndex = -1;
        let bestDist = Infinity;

        for (let i = 0; i < this.centroids.length; i++) {
            const c = this.centroids[i];
            if (!isFinite(c[0]) || !isFinite(c[1])) continue;

            const cScreen = this.transform.apply(c);

            const dx = cScreen[0] - centerScreen[0];
            const dy = cScreen[1] - centerScreen[1];
            const d = dx * dx + dy * dy;

            if (d < bestDist) {
                bestDist = d;
                bestIndex = i;
            }
        }

        if (bestIndex === -1) return null;

        return this.data.features[bestIndex].properties['zona'] || null;
    }

    private drawLabels() {
        const k = this.transform.k;
        const zoomLimitPintarLabels = this.m.esMobil ? 25 : 10;
        if (k < zoomLimitPintarLabels) return;

        const zonaCentre = this.getCenterZona();

        const centerScreen: [number, number] = [this.width / 2, this.height / 2];
        const radius = Math.min(this.width, this.height) * (this.m.esMobil ? 0.25 : 0.5);

        const ctx = this.ctx;
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const basePx = 14;

        for (let i = 0; i < this.centroids.length; i++) {
            const f = this.data.features[i];

            if (zonaCentre && f.properties['zona'] !== zonaCentre) continue;

            const c = this.centroids[i];
            if (!isFinite(c[0]) || !isFinite(c[1])) continue;

            const cScreen = this.transform.apply(c);

            const dx = cScreen[0] - centerScreen[0];
            const dy = cScreen[1] - centerScreen[1];
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Eliminar els de fora del radi //
            // if (dist > radius) continue;

            const t = 1 - (dist / radius);
            const scale = 0.8 + t * 0.4;

            if (scale <= 0) continue;

            const lines = this.splitLabel(f.properties['name']);

            ctx.save();
            ctx.translate(c[0], c[1]);
            ctx.scale(scale / k, scale / k);
            ctx.font = `${basePx}px sans-serif`;

            for (let j = 0; j < lines.length; j++) {
                ctx.fillText(
                    lines[j],
                    0,
                    (j - (lines.length - 1) / 2) * (basePx * 1.2)
                );
            }

            ctx.restore();
        }
    }

    private splitLabel(text: string): string[] {
        const words = text.split(' ');

        if (text.length <= 12 || words.length === 1) return [text];

        let bestSplit = 1;
        let bestDiff = Infinity;

        for (let i = 1; i < words.length; i++) {
            const line1 = words.slice(0, i).join(' ');
            const line2 = words.slice(i).join(' ');
            const diff = Math.abs(line1.length - line2.length);

            if (diff < bestDiff) {
                bestDiff = diff;
                bestSplit = i;
            }
        }

        return [
            words.slice(0, bestSplit).join(' '),
            words.slice(bestSplit).join(' ')
        ];
    }

    private setupClick() {
        const canvas = this.canvasRef.nativeElement;

        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const local = this.transform.invert([x, y]);

            for (let i = 0; i < this.pathsCache.length; i++) {
                if (this.ctx.isPointInPath(this.pathsCache[i], local[0], local[1])) {
                    const f = this.data.features[i];
                    this.state.selected$.next(f.properties);
                    alert(f.properties['name']);
                    break;
                }
            }
        });
    }

    private saveTransform() {
        const { x, y, k } = this.transform;
        localStorage.setItem('map-transform', JSON.stringify({ x, y, k }));
    }

    private loadTransform(): d3.ZoomTransform | null {
        const raw = localStorage.getItem('map-transform');
        if (!raw) return null;

        try {
            const { x, y, k } = JSON.parse(raw);
            return d3.zoomIdentity.translate(x, y).scale(k);
        } catch {
            return null;
        }
    }
}
