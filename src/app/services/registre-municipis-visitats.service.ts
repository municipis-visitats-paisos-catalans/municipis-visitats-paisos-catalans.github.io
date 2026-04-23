import { inject, Injectable } from "@angular/core";
import { AppStateService } from "src/app/services/app-state.service";

@Injectable({ providedIn: 'root' })
export class RegistreMunicipisVisitatsService {
    private readonly CLAU = "municipisVisitats";

    private ass = inject(AppStateService);

    public carregar() {
        let raw = localStorage.getItem(this.CLAU);
        if (!raw) return;

        try {
            this.ass.municipisVisitats = JSON.parse(raw);
        } catch { }
    }

    public guardar() {
        localStorage.setItem(this.CLAU, JSON.stringify(this.ass.municipisVisitats));
    }

}
