import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MapaStateService {
    selected$ = new BehaviorSubject<any>(null);
    center$ = new BehaviorSubject<any>(null);

    hover$ = new BehaviorSubject<any>(null);
    mouse$ = new BehaviorSubject<{ x: number; y: number } | null>(null);
}
