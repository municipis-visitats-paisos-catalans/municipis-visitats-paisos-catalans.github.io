import { inject, Injectable } from '@angular/core';
import { MapaStateService } from 'src/app/services/mapa-state.service';
import { MunicipiUtils } from 'src/app/shared/utils/municipi.utils';
import { StorageUtils } from 'src/app/shared/utils/storage.utils';
import { Utils } from 'src/app/shared/utils/utils';

@Injectable({ providedIn: 'root' })
export class AppStateService {

    municipis: Record<string, any> = {};
    municipisAmbDades: Record<string, { data?: string, nota?: string }> = {};
    private mapaState = inject(MapaStateService);


    public toggleVisita(id: string) {
        const municipiEsborratPrefix = "municipiEsborrat_";
        const municipiEsborratDies = 1;

        let nomCookie = municipiEsborratPrefix + MunicipiUtils.simplificarId(id);

        this.municipisAmbDades[id] ??= {};
        const municipi = this.municipisAmbDades[id];

        // Eliminar visita //
        if (municipi.data) {
            StorageUtils.setCookieDays(nomCookie, municipi.data, municipiEsborratDies);

            delete municipi.data;
        }
        // Registrar visita //
        else {
            let dataCookie = StorageUtils.getCookie(nomCookie);
            let data: Date = dataCookie ? new Date(dataCookie) : new Date();

            municipi.data = data.toISOString();

            StorageUtils.removeCookie(nomCookie);
        }

        if (!Utils.objTeValors(municipi)) delete this.municipisAmbDades[id];

        this.mapaState.actualitzarMapa$.next();
    }

    public getNota(id: string): string {
        return this.municipisAmbDades[id]?.nota || "";
    }

    public setNota(id: string, text: string) {
        this.municipisAmbDades[id] ??= {};
        if (!text) {
            delete this.municipisAmbDades[id].nota;
            if (!Utils.objTeValors(this.municipisAmbDades[id])) delete this.municipisAmbDades[id];
        } else {
            this.municipisAmbDades[id].nota = text;
        }
    }


}
