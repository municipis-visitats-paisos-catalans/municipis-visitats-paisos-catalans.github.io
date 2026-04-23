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
import { AppStateService } from 'src/app/services/app-state.service';
import { FeatureCollectionType, GeoService } from 'src/app/services/geo.service';
import { MainService } from 'src/app/services/main.service';
import { MapaStateService } from 'src/app/services/mapa-state.service';
import { RegistreMunicipisVisitatsService } from 'src/app/services/registre-municipis-visitats.service';
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
    private mapState = inject(MapaStateService);
    private appState = inject(AppStateService);
    private registreMunicipisVisitats = inject(RegistreMunicipisVisitatsService);
    private m = inject(MainService);

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

    ngAfterViewInit() {
        const canvas = this.canvasRef.nativeElement;
        this.ctx = canvas.getContext('2d')!;

        this.geo.load().subscribe((d) => {
            this.data = d;

            // Omplir objecte municipis //
            this.appState.municipis = {};
            for (const feature of this.data.features) {
                this.appState.municipis[feature.id!] = feature;
            }
            // Omplir objecte municipisVisitats //
            this.registreMunicipisVisitats.carregar();


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

            this.setupEvents();
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
        const colors = this.getColors();

        for (let i = 0; i < this.pathsCache.length; i++) {
            const p = this.pathsCache[i];
            const f = this.data.features[i];

            const isSelected = this.appState.municipisVisitats[f.id!];
            const isInactive = zonaCentre && f.properties['zona'] !== zonaCentre;

            const alpha = isInactive ? 0.3 : 1;

            const fill = isSelected ? colors.visited : colors.unvisited;

            ctx.fillStyle = `hsla(${fill}, ${alpha})`;
            ctx.strokeStyle = `hsla(${colors.stroke}, ${isInactive ? 0 : 1})`;

            ctx.fill(p);
            ctx.stroke(p);
        }

        this.drawLabels(colors);

        ctx.restore();
    }

    private getColors() {
        if (Utils.darkMode) {
            return {
                // unvisited: '50, 100%, 93%', // hsl(50, 100%, 93%) //
                // stroke: '50, 50%, 75%',    // hsl(50, 50%, 75%) //
                unvisited: '217, 39%, 45%', // hsl(217, 39%, 18%) //
                visited: '50, 100%, 50%',   // hsl(50, 100%, 50%) //
                stroke: '217, 39%, 65%',    // hsl(211, 31%, 35%) //
                labelVisited: '#000',
                labelUnvisited: '#fff'
            };
        }

        return {
            unvisited: '50, 0%, 100%',  // hsl(50, 0%, 100%) //
            visited: '50, 100%, 50%',   // hsl(50, 100%, 50%) //
            stroke: '0, 0%, 85%',       // hsl(0, 0%, 85%) //
            labelVisited: '#000',
            labelUnvisited: '#000'
        };
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

    private drawLabels(colors: any) {
        const k = this.transform.k;
        const zoomLimitPintarLabels = this.m.esMobil ? 25 : 10;
        if (k < zoomLimitPintarLabels) return;

        const zonaCentre = this.getCenterZona();

        const centerScreen: [number, number] = [this.width / 2, this.height / 2];
        const radius = Math.min(this.width, this.height) * (this.m.esMobil ? 0.25 : 0.5);

        const ctx = this.ctx;
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
            const municipiVisitat = !!this.appState.municipisVisitats[f.id!];

            // Eliminar els de fora del radi //
            // if (dist > radius) continue;

            const t = 1 - (dist / radius);
            const scale = 0.8 + t * 0.4;

            if (scale <= 0) continue;

            const lines = this.splitLabel(f.properties['name:ca'] || f.properties['name']);

            ctx.save();
            ctx.translate(c[0], c[1]);
            ctx.scale(scale / k, scale / k);

            ctx.fillStyle = municipiVisitat
                ? colors.labelVisited
                : colors.labelUnvisited;
            
            if (!municipiVisitat && Utils.darkMode) {
                // Ombra //
                ctx.shadowColor = 'hsl(217, 39%, 45%)';
                ctx.shadowBlur = 4;
            }

            ctx.font = `bold ${basePx}px sans-serif`;

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

    private setupEvents() {
        const canvas = this.canvasRef.nativeElement;

        let timer: any = null;
        let startX = 0;
        let startY = 0;
        let moved = false;
        let longPress = false;

        const LONG_PRESS_MS = 400;
        const MOVE_TOLERANCE = 8;

        const getIndex = (x: number, y: number): number | null => {
            const rect = canvas.getBoundingClientRect();

            const px = x - rect.left;
            const py = y - rect.top;

            const { x: tx, y: ty, k } = this.transform;

            const lx = (px - tx) / k;
            const ly = (py - ty) / k;

            for (let i = 0; i < this.pathsCache.length; i++) {
                if (this.ctx.isPointInPath(this.pathsCache[i], lx, ly)) {
                    return i;
                }
            }

            return null;
        };

        canvas.addEventListener('pointerdown', (e: PointerEvent) => {
            startX = e.clientX;
            startY = e.clientY;

            moved = false;
            longPress = false;

            timer = setTimeout(() => {
                if (moved) return;

                const i = getIndex(startX, startY);
                if (i === null) return;

                const f = this.data.features[i];

                this.onLongClick(<string>f.id);
                
                this.draw();

                longPress = true;
            }, LONG_PRESS_MS);
        });

        canvas.addEventListener('pointermove', (e: PointerEvent) => {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (Math.abs(dx) > MOVE_TOLERANCE || Math.abs(dy) > MOVE_TOLERANCE) {
                moved = true;
                clearTimeout(timer);
            }
        });

        canvas.addEventListener('pointerup', (e: PointerEvent) => {
            clearTimeout(timer);

            if (moved || longPress) return;

            const i = getIndex(e.clientX, e.clientY);
            if (i === null) return;

            const f = this.data.features[i];

            this.onClick(<string>f.id);
        });

        canvas.addEventListener('pointerleave', () => {
            clearTimeout(timer);
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



    // Clicks //
    private onClick(id: string) {
        
        alert(this.appState.municipis[id].properties['name']);

        this.mapState.municipiSeleccionat$.next(this.appState.municipis[id]);

        // <El modal s'obre sol al fer el .next()> //
    }
    private onLongClick(id: string) {
        this.appState.toggleVisita(id);

        this.registreMunicipisVisitats.guardar();
    }
}
