import { TextFieldModule } from '@angular/cdk/text-field';
import { AsyncPipe } from '@angular/common';
import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatRipple } from "@angular/material/core";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import * as d3 from 'd3';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Municipi } from 'src/app/models/municipi';
import { AppStateService } from 'src/app/services/app-state.service';
import { MapaStateService } from 'src/app/services/mapa-state.service';
import { PersistenciaMunicipisVisitatsService } from 'src/app/services/persistencia-municipis-visitats.service';

@Component({
    selector: 'jmp-resultat',
    imports: [
        MatRipple,
        MatFormFieldModule,
        MatInputModule,
        TextFieldModule,
        FormsModule,
        AsyncPipe
    ],
    templateUrl: './resultat.html',
    styleUrl: './resultat.scss'
})
export class Resultat implements OnInit {
    @Input() municipi: Municipi;

    appState = inject(AppStateService);
    mapState = inject(MapaStateService);
    persistencia = inject(PersistenciaMunicipisVisitatsService);


    ngOnInit() {
        this.generarSiluetaMunicipiPath();
    }

    public get textDataVisita() {
        return this.municipi.dataVisita ?
            this.municipi.dataVisita.toLocaleString('ca-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            }) :
            "No visitat";
    }

    pathD: string = '';
    viewBox: string = '';
    generarSiluetaMunicipiPath() {
        if (!this.municipi?.geometry) return;

        const feature: any = {
            type: 'Feature',
            geometry: this.municipi.geometry
        };

        // Projecció base (sense mida fixa)
        const projection = d3.geoMercator();

        const path = d3.geoPath(projection);

        // Ajusta escala i translació automàticament
        projection.fitExtent([[0, 0], [1, 1]], feature);

        // Genera el path
        this.pathD = path(feature) || '';

        // Calcula bounds reals després de projectar
        const [[x0, y0], [x1, y1]] = path.bounds(feature);

        const width = x1 - x0;
        const height = y1 - y0;

        // ViewBox exacte al contingut
        this.viewBox = `${x0} ${y0} ${width} ${height}`;
    }

    toggleVisita() {
        this.municipi.toggleVisita();
        this.persistencia.guardar();
    }

    obrirModalMunicipi() {
        this.mapState.idMunicipiSeleccionat$.next(this.municipi.id);
    }
}
