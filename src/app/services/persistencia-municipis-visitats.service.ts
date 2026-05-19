import { inject, Injectable } from "@angular/core";
import { AppStateService } from "src/app/services/app-state.service";

@Injectable({ providedIn: 'root' })
export class PersistenciaMunicipisVisitatsService {
    private readonly CLAU = "municipisVisitats";

    private appState = inject(AppStateService);

    public carregar() {
        let raw = localStorage.getItem(this.CLAU);
        if (!raw) return;

        try {
            this.appState.municipisAmbDades = JSON.parse(raw);
        } catch { }
    }

    public guardar() {
        localStorage.setItem(this.CLAU, JSON.stringify(this.appState.municipisAmbDades));
        
        // console.log(JSON.stringify(this.appState.municipisAmbDades));
    }

}
