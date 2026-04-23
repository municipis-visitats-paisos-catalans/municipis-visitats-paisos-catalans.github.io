import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MapaStateService {
    municipiSeleccionat$ = new BehaviorSubject<any>(null);
    municipiAlCentre$ = new BehaviorSubject<any>(null);

}
