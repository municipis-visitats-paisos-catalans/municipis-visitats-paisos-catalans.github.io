import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MapaStateService {
    idMunicipiSeleccionat$ = new BehaviorSubject<string | null>(null);
    municipiAlCentre$ = new BehaviorSubject<any>(null);

}
