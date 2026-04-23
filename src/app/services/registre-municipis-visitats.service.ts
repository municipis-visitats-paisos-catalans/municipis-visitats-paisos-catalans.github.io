import { Injectable } from "@angular/core";
import { MapaStateService } from "src/app/services/mapa-state.service";

@Injectable({ providedIn: 'root' })
export class RegistreMunicipisVisitatsService {
    private readonly CLAU = "municipisVisitats";

    constructor(private mss: MapaStateService) { }

    public carregar() {
        let raw = localStorage.getItem(this.CLAU);
        if (!raw) return;

        try {
            this.mss.municipisVisitats = JSON.parse(raw);
        } catch { }
    }

    public guardar() {
        localStorage.setItem(this.CLAU, JSON.stringify(this.mss.municipisVisitats));
    }

}
