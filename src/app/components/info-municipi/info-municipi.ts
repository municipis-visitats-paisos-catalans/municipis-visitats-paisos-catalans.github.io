import { TextFieldModule } from '@angular/cdk/text-field';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatRipple } from "@angular/material/core";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import * as d3 from 'd3';
import { Subscription } from 'rxjs';
import { Municipi } from 'src/app/models/municipi';
import { AppStateService } from 'src/app/services/app-state.service';
import { MapaStateService } from 'src/app/services/mapa-state.service';
import { PersistenciaMunicipisVisitatsService } from 'src/app/services/persistencia-municipis-visitats.service';

@Component({
    selector: 'jmp-info-municipi',
    imports: [
        MatRipple,
        MatFormFieldModule,
        MatInputModule,
        TextFieldModule,
        FormsModule,
    ],
    templateUrl: './info-municipi.html',
    styleUrl: './info-municipi.scss'
})
export class InfoMunicipi implements OnInit, OnDestroy {

    public mapState = inject(MapaStateService);
    public appState = inject(AppStateService);
    public persistencia = inject(PersistenciaMunicipisVisitatsService);

    public subscripcioMunicipi: Subscription;

    public municipi: Municipi;


    ngOnInit() {
        this.subscripcioMunicipi = this.mapState.idMunicipiSeleccionat$.subscribe((id: number | null) => {
            if (!id) return;

            this.municipi = this.appState.municipis[id];

            this.generarSiluetaMunicipiPath();
        });
    }

    ngOnDestroy() { this.subscripcioMunicipi.unsubscribe(); }

    public get textDataVisita() {
        return this.municipi.dataVisita ?
            "Visitat el " + this.municipi.dataVisita.toLocaleString('ca-ES', { dateStyle: 'long', timeStyle: 'short' }) :
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

}
