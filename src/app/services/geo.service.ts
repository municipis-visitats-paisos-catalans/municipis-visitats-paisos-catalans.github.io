import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { feature } from 'topojson-client';

export type GeometryType = GeoJSON.Polygon | GeoJSON.MultiPolygon;
export type FeatureType = GeoJSON.Feature<GeometryType, Record<string, any>>;
export type FeatureCollectionType = GeoJSON.FeatureCollection<GeometryType, Record<string, any>>;

@Injectable({ providedIn: 'root' })
export class GeoService {
    constructor(private http: HttpClient) { }

    load() {
        return this.http
            .get<any>('assets/geojson/paisos-catalans-3perc.json')
            .pipe(
                map((topo) => {
                    const name = Object.keys(topo.objects)[0];
                    const geo: any = feature(topo, topo.objects[name]);

                    const fc: FeatureCollectionType =
                        geo.type === 'FeatureCollection'
                            ? geo
                            : { type: 'FeatureCollection', features: [geo] };

                    // només polígons
                    fc.features = fc.features.filter(
                        (f: any) =>
                            f?.geometry?.type === 'Polygon' ||
                            f?.geometry?.type === 'MultiPolygon'
                    );

                    return fc;
                })
            );
    }
}
