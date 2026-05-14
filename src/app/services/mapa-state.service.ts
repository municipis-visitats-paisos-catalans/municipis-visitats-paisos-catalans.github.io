import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MapaStateService {
    idMunicipiSeleccionat$ = new BehaviorSubject<string | null>(null);
    municipiAlCentre$ = new BehaviorSubject<any>(null);
    
    actualitzarMapa$ = new Subject<void>();
}
