import { inject, Injectable } from '@angular/core';
import { MapaStateService } from 'src/app/services/mapa-state.service';
import { MunicipiUtils } from 'src/app/shared/utils/municipi.utils';
import { StorageUtils } from 'src/app/shared/utils/storage.utils';

@Injectable({ providedIn: 'root' })
export class AppStateService {

    municipis: Record<string, any> = {};
    municipisVisitats: Record<string, string> = {};
    private mapaState = inject(MapaStateService);


    public toggleVisita(id: string) {
        const municipiEsborratPrefix = "municipiEsborrat_";
        const municipiEsborratDies = 1;

        let nomCookie = municipiEsborratPrefix + MunicipiUtils.simplificarId(id);

        // Eliminar visita //
        if (this.municipisVisitats[id]) {
            StorageUtils.setCookieDays(nomCookie, this.municipisVisitats[id], municipiEsborratDies);

            delete this.municipisVisitats[id];
        }
        // Registrar visita //
        else {
            let dataCookie = StorageUtils.getCookie(nomCookie);
            let data: Date = dataCookie ? new Date(dataCookie) : new Date();

            this.municipisVisitats[id] = data.toISOString();

            StorageUtils.removeCookie(nomCookie);
        }

        this.mapaState.actualitzarMapa$.next();
    }

}
