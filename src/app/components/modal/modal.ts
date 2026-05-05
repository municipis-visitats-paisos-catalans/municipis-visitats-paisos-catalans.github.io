import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { InfoMunicipi } from 'src/app/components/info-municipi/info-municipi';
import { MapaStateService } from 'src/app/services/mapa-state.service';

@Component({
    selector: 'jmp-modal',
    imports: [
        CommonModule,
        InfoMunicipi,
    ],
    templateUrl: './modal.html',
    styleUrl: './modal.scss',
})
export class ModalComponent implements OnInit, OnDestroy {

    private mapState = inject(MapaStateService);
    private destroy$ = new Subject<void>();

    visible = false;
    obert = false;
    animantTancament = false;

    ngOnInit(): void {
        this.mapState.idMunicipiSeleccionat$
            .pipe(takeUntil(this.destroy$))
            .subscribe(id => {
                if (id) {
                    this.visible = true;
                    this.animantTancament = false;
                    setTimeout(() => this.obert = true);
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
        this.mapState.idMunicipiSeleccionat$.next(null);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }


}
