import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { FeatureCollectionType, FeatureType } from './geo.service';

@Injectable({ providedIn: 'root' })
export class MapaLogicService {

    // retorna municipis visibles al centre
    getVisibleFeatures(
        data: FeatureCollectionType,
        path: d3.GeoPath<any, any>,
        transform: d3.ZoomTransform,
        width: number,
        height: number
    ): FeatureType[] {

        const centerScreen: [number, number] = [width / 2, height / 2];
        const centerLocal = transform.invert(centerScreen);

        const radius = Math.min(width, height) * 0.25;

        return data.features.filter((f: any) => {
            const c = path.centroid(f);
            if (!isFinite(c[0]) || !isFinite(c[1])) return false;

            const dx = c[0] - centerLocal[0];
            const dy = c[1] - centerLocal[1];

            return (dx * dx + dy * dy) < (radius * radius);
        });
    }

    // municipi més proper al centre
    getCenterFeature(
        data: FeatureCollectionType,
        path: d3.GeoPath<any, any>,
        transform: d3.ZoomTransform,
        width: number,
        height: number
    ): FeatureType | null {

        const centerScreen: [number, number] = [width / 2, height / 2];
        const centerLocal = transform.invert(centerScreen);

        let best: FeatureType | null = null;
        let bestDist = Infinity;

        for (const f of data.features) {
            const c = path.centroid(f);

            const dx = c[0] - centerLocal[0];
            const dy = c[1] - centerLocal[1];
            const d = dx * dx + dy * dy;

            if (d < bestDist) {
                bestDist = d;
                best = f;
            }
        }

        return best;
    }

    // mida de text segons zoom (controlada)
    getFontSize(k: number): number {
        return Math.max(8, Math.min(16, 10 + (k - 5) * 2));
    }
}
