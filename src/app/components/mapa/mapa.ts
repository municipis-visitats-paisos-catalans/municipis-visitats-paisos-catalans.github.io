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

    private needsDraw = false;

    private _colors: any;

    private get colors() {
        if (!this._colors || this._colors._dark !== Utils.darkMode) {
            this._colors = Utils.darkMode ? {
                _dark: true,
                // unvisited: '50, 100%, 93%',      // hsl(50, 100%, 93%) //
                // stroke: '50, 50%, 75%',          // hsl(50, 50%, 75%) //
                unvisited: { h: 217, s: 39, l: 45 },        // hsl(217, 39%, 18%) //
                visited: { h: 50, s: 100, l: 50 },          // hsl(50, 100%, 50%) //
                stroke: { h: 217, s: 39, l: 65 },           // hsl(211, 31%, 35%) //

                labelVisited: { h: 50, s: 100, l: 0 },      // hsl(50, 100%, 0%) //
                labelUnvisited: { h: 217, s: 100, l: 100 }  // hsl(217, 100%, 100%) //
            } : {
                _dark: false,
                unvisited: { h: 50, s: 0, l: 100 },         // hsl(50, 0%, 100%) //
                visited: { h: 50, s: 100, l: 50 },          // hsl(50, 100%, 50%) //
                stroke: { h: 0, s: 0, l: 85 },          // hsl(0, 0%, 85%) //

                labelVisited: { h: 50, s: 100, l: 0 },      // hsl(50, 100%, 0%) //
                labelUnvisited: { h: 0, s: 0, l: 0 }        // hsl(0, 0%, 0%) //
            };
        }
        return this._colors;
    }

    private scheduleDraw() {
        if (this.needsDraw) return;

        this.needsDraw = true;

        requestAnimationFrame(() => {
            this.needsDraw = false;
            this.draw();
        });
    }

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
            this.scheduleDraw();
        });
    }

    @HostListener('window:resize')
    resize() {
        if (!this.data) return;
        this.render();
        this.buildCache();
        this.scheduleDraw();
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

                let { x, y, k } = e.transform;

                const padding = 50 * (k ** 0.25);
                const paddingTop = 96;

                const scaledWidth = this.width * k;
                const scaledHeight = this.height * k;

                const minX = this.width - padding - scaledWidth;
                const maxX = padding;

                const minY = this.height - padding - scaledHeight;
                const maxY = padding + paddingTop;

                const clampedX = Math.max(minX, Math.min(maxX, x));
                const clampedY = Math.max(minY, Math.min(maxY, y));

                const clampedTransform = d3.zoomIdentity
                    .translate(clampedX, clampedY)
                    .scale(k);

                if (clampedX !== x || clampedY !== y) {
                    d3.select(canvas).call(this.zoom.transform, clampedTransform);
                    return;
                }

                this.transform = clampedTransform;
                this.saveTransform();
                this.scheduleDraw();
            });

        d3.select(canvas).call(this.zoom);
    }

    private draw() {
        const ctx = this.ctx;
        const { x, y, k } = this.transform;

        const colors = this.colors;
        const zonaCentre = this.getCenterZona();

        ctx.clearRect(0, 0, this.width, this.height);

        ctx.save();
        ctx.setTransform(k, 0, 0, k, x, y);
        ctx.lineWidth = 0.5 / k;

        for (let i = 0; i < this.pathsCache.length; i++) {
            const p = this.pathsCache[i];
            const f = this.data.features[i];

            const isSelected = this.appState.municipisVisitats[f.id!];
            const isInactive = zonaCentre && f.properties['zona'] !== zonaCentre;

            const alpha = isInactive ? 0.3 : 1;
            const fill = isSelected ? colors.visited : colors.unvisited;

            ctx.fillStyle = `hsla(${fill.h}, ${fill.s}%, ${fill.l}%, ${alpha})`;
            ctx.strokeStyle = `hsla(${colors.stroke.h}, ${colors.stroke.s}%, ${colors.stroke.l}%, ${isInactive ? 0 : 1})`;

            ctx.fill(p);
            ctx.stroke(p);
        }

        this.drawLabels(colors, zonaCentre);

        ctx.restore();
    }
    private getCenterZona(): string | null {
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        const { x, y, k } = this.transform;

        let bestIndex = -1;
        let bestDist = Infinity;

        for (let i = 0; i < this.centroids.length; i++) {
            const c = this.centroids[i];
            if (!isFinite(c[0]) || !isFinite(c[1])) continue;

            const sx = c[0] * k + x;
            const sy = c[1] * k + y;

            const dx = sx - centerX;
            const dy = sy - centerY;
            const d = dx * dx + dy * dy;

            if (d < bestDist) {
                bestDist = d;
                bestIndex = i;
            }
        }

        if (bestIndex === -1) return null;

        return this.data.features[bestIndex].properties['zona'] || null;
    }

    private drawLabels(colors: any, zonaCentre: string | null) {
        const { x, y, k } = this.transform;
        const zoomLimit = this.m.esMobil ? 30 : 10;
        if (k < zoomLimit) return;

        const ctx = this.ctx;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const fontSize = 12;

        let maxVisibleArea = 0;

        // PASSADA 1: trobar max area
        for (let i = 0; i < this.data.features.length; i++) {
            const f = this.data.features[i];

            if (zonaCentre && f.properties['zona'] !== zonaCentre) continue;

            const c = this.centroids[i];

            const sx = c[0] * k + x;
            const sy = c[1] * k + y;

            const margin = 200;
            if (
                sx < -margin || sx > this.width + margin ||
                sy < -margin || sy > this.height + margin
            ) continue;

            const visiblePoly = this.getVisiblePolygonScreen(f);
            if (!visiblePoly || visiblePoly.length < 3) continue;

            const area = Math.abs(this.getPolygonAreaScreen(visiblePoly));
            if (area > maxVisibleArea) maxVisibleArea = area;
        }

        // PASSADA 2: dibuixar
        for (let i = 0; i < this.data.features.length; i++) {
            const f = this.data.features[i];

            if (zonaCentre && f.properties['zona'] !== zonaCentre) continue;

            const c = this.centroids[i];

            const sx = c[0] * k + x;
            const sy = c[1] * k + y;

            const margin = 200;
            if (
                sx < -margin || sx > this.width + margin ||
                sy < -margin || sy > this.height + margin
            ) continue;

            const visiblePoly = this.getVisiblePolygonScreen(f);
            if (!visiblePoly || visiblePoly.length < 3) continue;

            const area = Math.abs(this.getPolygonAreaScreen(visiblePoly));

            const tArea = Math.sqrt(maxVisibleArea > 0 ? area / maxVisibleArea : 0);
            const zoomFactor = Math.min(1, k / (this.m.esMobil ? 35 : 15));
            const scale = (0.5 + tArea * 0.9) * zoomFactor;

            const labelScreen = this.getPolygonCentroidScreen(visiblePoly);
            const labelWorld = this.transform.invert(labelScreen);

            const municipiVisitat = !!this.appState.municipisVisitats[f.id!];

            const distToEdge = Math.min(
                sx,
                this.width - sx,
                sy,
                this.height - sy
            );

            const t = Math.max(0, Math.min(1,
                distToEdge / (Math.min(this.width, this.height) / 2)
            ));

            const base = municipiVisitat ? colors.labelVisited : colors.labelUnvisited;
            let { h, s, l } = base;

            if (l === 0) l = (1 - t) * 30;
            else if (l === 100) l = 70 + t * 30;

            ctx.save();
            ctx.translate(labelWorld[0], labelWorld[1]);

            const zoomBoost = Math.pow(k, 0.05);
            ctx.scale((scale * zoomBoost) / k, (scale * zoomBoost) / k);

            ctx.fillStyle = `hsl(${h}, ${s}%, ${l}%)`;

            if (!municipiVisitat && Utils.darkMode) {
                ctx.shadowColor = `hsl(${colors.unvisited.h}, ${colors.unvisited.s}%, ${colors.unvisited.l}%)`;
                ctx.shadowBlur = 4;
            }

            ctx.font = `bold ${fontSize}px sans-serif`;

            const lines = this.splitLabel(f.properties['name:ca'] || f.properties['name']);

            for (let j = 0; j < lines.length; j++) {
                ctx.fillText(
                    lines[j],
                    0,
                    (j - (lines.length - 1) / 2) * (fontSize * 1.2)
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

    private getVisiblePolygonScreen(feature: any): [number, number][] | null {
        const geom = feature.geometry;
        if (!geom) return null;

        const polygons = geom.type === 'Polygon'
            ? [geom.coordinates]
            : geom.type === 'MultiPolygon'
                ? geom.coordinates
                : [];

        let best: [number, number][] | null = null;
        let bestArea = 0;

        for (const polygon of polygons) {
            const outerRing = polygon[0];
            if (!outerRing) continue;

            const screenRing: [number, number][] = [];

            for (let i = 0; i < outerRing.length; i++) {
                const coord = outerRing[i];
                const projected = this.projection(coord);
                if (!projected) continue;

                const sx = projected[0] * this.transform.k + this.transform.x;
                const sy = projected[1] * this.transform.k + this.transform.y;

                screenRing.push([sx, sy]);
            }

            const clipped = this.clipPolygonToViewport(screenRing);
            if (clipped.length < 3) continue;

            const area = Math.abs(this.getPolygonAreaScreen(clipped));

            if (area > bestArea) {
                bestArea = area;
                best = clipped;
            }
        }

        return best;
    }

    private clipPolygonToViewport(poly: [number, number][]): [number, number][] {
        let output = poly;

        output = this.clipLeft(output, 0);
        output = this.clipRight(output, this.width);
        output = this.clipTop(output, 0);
        output = this.clipBottom(output, this.height);

        return output;
    }

    private clipLeft(poly: [number, number][], minX: number): [number, number][] {
        return this.clipPolygon(poly, p => p[0] >= minX, (a, b) => {
            const t = (minX - a[0]) / (b[0] - a[0]);
            return [minX, a[1] + t * (b[1] - a[1])];
        });
    }

    private clipRight(poly: [number, number][], maxX: number): [number, number][] {
        return this.clipPolygon(poly, p => p[0] <= maxX, (a, b) => {
            const t = (maxX - a[0]) / (b[0] - a[0]);
            return [maxX, a[1] + t * (b[1] - a[1])];
        });
    }

    private clipTop(poly: [number, number][], minY: number): [number, number][] {
        return this.clipPolygon(poly, p => p[1] >= minY, (a, b) => {
            const t = (minY - a[1]) / (b[1] - a[1]);
            return [a[0] + t * (b[0] - a[0]), minY];
        });
    }

    private clipBottom(poly: [number, number][], maxY: number): [number, number][] {
        return this.clipPolygon(poly, p => p[1] <= maxY, (a, b) => {
            const t = (maxY - a[1]) / (b[1] - a[1]);
            return [a[0] + t * (b[0] - a[0]), maxY];
        });
    }

    private clipPolygon(
        poly: [number, number][],
        inside: (p: [number, number]) => boolean,
        intersect: (a: [number, number], b: [number, number]) => [number, number]
    ): [number, number][] {
        const result: [number, number][] = [];

        for (let i = 0; i < poly.length; i++) {
            const current = poly[i];
            const previous = poly[(i - 1 + poly.length) % poly.length];

            const currentInside = inside(current);
            const previousInside = inside(previous);

            if (currentInside) {
                if (!previousInside) result.push(intersect(previous, current));
                result.push(current);
            } else if (previousInside) {
                result.push(intersect(previous, current));
            }
        }

        return result;
    }

    private getPolygonAreaScreen(poly: [number, number][]): number {
        let area = 0;

        for (let i = 0; i < poly.length; i++) {
            const a = poly[i];
            const b = poly[(i + 1) % poly.length];
            area += a[0] * b[1] - b[0] * a[1];
        }

        return area / 2;
    }

    private getPolygonCentroidScreen(poly: [number, number][]): [number, number] {
        let x = 0;
        let y = 0;
        let area = 0;

        for (let i = 0; i < poly.length; i++) {
            const a = poly[i];
            const b = poly[(i + 1) % poly.length];

            const cross = a[0] * b[1] - b[0] * a[1];

            x += (a[0] + b[0]) * cross;
            y += (a[1] + b[1]) * cross;
            area += cross;
        }

        area *= 0.5;

        if (Math.abs(area) < 0.0001) {
            let sx = 0, sy = 0;
            for (const p of poly) {
                sx += p[0];
                sy += p[1];
            }
            return [sx / poly.length, sy / poly.length];
        }

        return [x / (6 * area), y / (6 * area)];
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

                this.scheduleDraw();

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

        this.mapState.idMunicipiSeleccionat$.next(id);

        // <El modal s'obre sol al fer el .next()> //
    }
    private onLongClick(id: string) {
        this.appState.toggleVisita(id);

        this.registreMunicipisVisitats.guardar();
    }
}
