import { Location } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatRipple } from '@angular/material/core';
import { ActivatedRoute, Router } from '@angular/router';
import { skip, Subject, takeUntil } from 'rxjs';
import { Mapa } from 'src/app/components/mapa/mapa';
import { ModalBuscador } from 'src/app/components/modals/modal-buscador/modal-buscador';
import { ModalMunicipi } from 'src/app/components/modals/modal-municipi/modal-municipi';
import { AppStateService } from 'src/app/services/app-state.service';
import { MapaStateService } from 'src/app/services/mapa-state.service';

@Component({
    selector: 'home-page',
    imports: [Mapa, ModalMunicipi, ModalBuscador, MatRipple],
    templateUrl: './home-page.html',
    styleUrl: './home-page.scss'
})
export class HomePage implements OnInit {

    private route = inject(ActivatedRoute);
    public router = inject(Router);

    appState = inject(AppStateService);
    private mapState = inject(MapaStateService);

    private destroy$ = new Subject<void>();

    private location = inject(Location);


    ngOnInit() {
        // URL -> estat //
        this.route.paramMap
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                let id = parseInt(location.pathname.split("/")[1]) || null;
                this.mapState.idMunicipiSeleccionat$.next(id);
            });

        // estat -> URL //
        this.mapState.idMunicipiSeleccionat$
            .pipe(takeUntil(this.destroy$), skip(1))
            .subscribe((id: number | null) => {
                this.location.go(id?.toString() ?? "");
            });
    }


    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
