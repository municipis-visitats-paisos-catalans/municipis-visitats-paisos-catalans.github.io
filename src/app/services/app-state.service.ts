import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppStateService {

    municipis: Record<string, any> = {};
    municipisVisitats: Record<string, Date> = {};


    public toggleVisita(id: string) {
        if (this.municipisVisitats[id]) delete this.municipisVisitats[id];
        else this.municipisVisitats[id] = new Date();
    }

}
