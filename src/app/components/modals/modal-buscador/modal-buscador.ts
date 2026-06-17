import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Buscador } from 'src/app/components/buscador/buscador';
import { AppStateService } from 'src/app/services/app-state.service';
import { MapaStateService } from 'src/app/services/mapa-state.service';
import { Utils } from 'src/app/shared/utils/utils';

@Component({
    selector: 'jmp-modal-buscador',
    imports: [
        CommonModule,
        Buscador,
    ],
    templateUrl: './modal-buscador.html',
    styleUrl: './modal-buscador.scss',
})
export class ModalBuscador implements OnInit, OnDestroy {

    private mapState = inject(MapaStateService);
    appState = inject(AppStateService);
    private destroy$ = new Subject<void>();

    visible = false;
    obert = false;
    animantTancament = false;

    async ngOnInit() {
        // Retardar l'execució del codi fins que municipis estigui carregat //
        await Utils.waitUntil(() => Utils.objTeValors(this.appState.municipis));

        this.appState.buscadorObert$
            .pipe(takeUntil(this.destroy$))
            .subscribe(id => {
                if (id) {
                    this.visible = true;
                    this.animantTancament = false;
                    setTimeout(() => this.obert = true, 10); // Assegurar animació //
                } else {
                    this.tancar();
                }
            });
    }

    tancar(): void {
        if (!this.visible) return;

        this.obert = false;
        this.animantTancament = true;

        setTimeout(() => {
            this.visible = false;
            this.animantTancament = false;
        }, 200);
    }

    onBackdropClick(): void {
        if (!this.obert) return; // Primer frame //
        this.appState.buscadorObert$.next(false);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }


}
