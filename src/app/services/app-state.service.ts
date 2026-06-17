import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Municipi } from 'src/app/models/municipi';
import { FeatureCollectionType, GeoService } from 'src/app/services/geo.service';
import { MapaStateService } from 'src/app/services/mapa-state.service';
import { PersistenciaMunicipisVisitatsService } from 'src/app/services/persistencia-municipis-visitats.service';
import { MunicipiUtils } from 'src/app/shared/utils/municipi.utils';
import { StorageUtils } from 'src/app/shared/utils/storage.utils';
import { Utils } from 'src/app/shared/utils/utils';

@Injectable({ providedIn: 'root' })
export class AppStateService {

    municipis: Record<number, Municipi> = {};
    private mapaState = inject(MapaStateService);
    private persistencia = inject(PersistenciaMunicipisVisitatsService);

    private geo = inject(GeoService);
    geoData!: FeatureCollectionType;

    buscadorObert$ = new BehaviorSubject<boolean>(false);

    constructor() {
        this.persistencia.inicialitzar(this);

        this.carregarMunicipis();
    }

    private carregarMunicipis() {
        this.geo.load().subscribe(geoData => {
            this.geoData = geoData;
            this.municipis = {};

            // Omplir objecte municipis //
            for (const feature of geoData.features) {
                feature.id = MunicipiUtils.simplificarId(feature.id as string);
                delete feature.properties["@id"];

                this.municipis[feature.id!] = new Municipi(feature, this);
            }
            // Omplir objecte municipisVisitats //
            this.persistencia.carregar();
        });
    }


    public toggleVisita(id: number) {
        const municipiEsborratPrefix = "municipiEsborrat_";
        const municipiEsborratDies = 1;

        let nomCookie = municipiEsborratPrefix + id;

        const municipi = this.municipis[id];

        // Eliminar visita //
        if (municipi.dataVisita) {
            StorageUtils.setCookieDays(nomCookie, municipi.dataVisita, municipiEsborratDies);

            municipi.dataVisita = null;
        }
        // Registrar visita //
        else {
            let dataCookie = StorageUtils.getCookie(nomCookie);
            municipi.dataVisita = dataCookie ? new Date(dataCookie) : new Date();

            StorageUtils.removeCookie(nomCookie);
        }

        if (!Utils.objTeValors(municipi)) delete this.municipis[id];

        this.mapaState.actualitzarMapa$.next();
    }

    get hiHaDadesLocals() {
        return Object.values(this.municipis).some(m => m.dataVisita || m.nota);
    }

}
