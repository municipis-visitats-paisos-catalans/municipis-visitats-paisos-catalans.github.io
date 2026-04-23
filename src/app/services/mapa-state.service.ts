import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MapaStateService {
    selected$ = new BehaviorSubject<any>(null);
    center$ = new BehaviorSubject<any>(null);

    hover$ = new BehaviorSubject<any>(null);
    mouse$ = new BehaviorSubject<{ x: number; y: number } | null>(null);

    municipis: Record<string, any> = {};
    municipisVisitats: Record<string, Date> = {};


    public toggleVisita(id: string) {
        if (this.municipisVisitats[id]) delete this.municipisVisitats[id];
        else this.municipisVisitats[id] = new Date();
    }

}
