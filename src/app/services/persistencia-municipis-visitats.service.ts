import { inject, Injectable } from "@angular/core";
import { AppStateService } from "src/app/services/app-state.service";

type DadesMunicipi = { data?: string, nota?: string };

@Injectable({ providedIn: 'root' })
export class PersistenciaMunicipisVisitatsService {
    private readonly CLAU = "municipisVisitats";

    private appState = inject(AppStateService);

    public carregar() {
        try {
            let raw = localStorage.getItem(this.CLAU);
            if (!raw) return;

            let dadesMunicipis: Record<number, DadesMunicipi> = JSON.parse(raw);

            for (const id in dadesMunicipis) {
                let { data, nota } = dadesMunicipis[id];

                if (data) this.appState.municipis[id].dataVisita = new Date(data);
                if (nota) this.appState.municipis[id].nota = nota;
            }

        } catch (e) {
            alert("Error al carregar dades de localStorage:\n\n" + e);
        }
    }

    public guardar() {
        let dadesMunicipis: Record<number, DadesMunicipi> = {};

        for (const id in this.appState.municipis) {
            const municipi = this.appState.municipis[id];

            if (municipi.dataVisita || municipi.nota) {
                dadesMunicipis[id] = {};
                if (municipi.dataVisita) dadesMunicipis[id].data = municipi.dataVisita.toISOString();
                if (municipi.nota) dadesMunicipis[id].nota = municipi.nota;
            }
        }
        localStorage.setItem(this.CLAU, JSON.stringify(dadesMunicipis));
        
        // console.log(JSON.stringify(dadesMunicipis));
    }

}
