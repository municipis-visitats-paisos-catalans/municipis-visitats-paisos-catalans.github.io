import { inject, Injectable } from "@angular/core";
import { AppStateService } from "src/app/services/app-state.service";

export type DadesMunicipi = { data?: string, nota?: string };
export type DadesMunicipis = Record<number, DadesMunicipi>;

@Injectable({ providedIn: 'root' })
export class PersistenciaMunicipisVisitatsService {
    private readonly CLAU = "municipisVisitats";

    private appState: AppStateService;

    inicialitzar(appState: AppStateService) { this.appState = appState; }

    guardar() {
        localStorage.setItem(this.CLAU, JSON.stringify(this.crearDadesMunicipis()));

        // console.log(JSON.stringify(dadesMunicipis));
    }


    carregar() {
        try {
            let raw = localStorage.getItem(this.CLAU);
            if (!raw) return;

            let dadesMunicipis: DadesMunicipis = JSON.parse(raw);

            this.carregarDadesMunicipis(dadesMunicipis);

        } catch (e) {
            alert("Error al carregar dades de localStorage:\n\n" + e);
        }
    }

    crearDadesMunicipis(): DadesMunicipis {
        let dadesMunicipis: DadesMunicipis = {};

        for (const [id, municipi] of Object.entries(this.appState.municipis)) {
            if (municipi.dataVisita || municipi.nota) {
                dadesMunicipis[id] = {};
                if (municipi.dataVisita) dadesMunicipis[id].data = municipi.dataVisita.toISOString();
                if (municipi.nota) dadesMunicipis[id].nota = municipi.nota;
            }
        }

        return dadesMunicipis;
    }

    carregarDadesMunicipis(dadesMunicipis: DadesMunicipis) {

        for (const [id, { data, nota }] of Object.entries(dadesMunicipis)) {
            if (!this.appState.municipis[id]) continue;
            if (data) this.appState.municipis[id].dataVisita = new Date(data);
            if (nota) this.appState.municipis[id].nota = nota;
        }

    }

}
