import { inject, Injectable } from '@angular/core';
import { Municipi } from 'src/app/models/municipi';
import { MapaStateService } from 'src/app/services/mapa-state.service';
import { StorageUtils } from 'src/app/shared/utils/storage.utils';
import { Utils } from 'src/app/shared/utils/utils';

@Injectable({ providedIn: 'root' })
export class AppStateService {

    municipis: Record<number, Municipi> = {};
    private mapaState = inject(MapaStateService);


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

}
