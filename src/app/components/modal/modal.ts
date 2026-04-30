import {
    Component,
    ChangeDetectionStrategy,
    inject,
    OnInit,
    OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapaStateService } from 'src/app/services/mapa-state.service';
import { AppStateService } from 'src/app/services/app-state.service';
import { Subject, takeUntil } from 'rxjs';
import { InfoMunicipi } from 'src/app/components/info-municipi/info-municipi';
import { ActivatedRoute, Router } from '@angular/router';

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
    animantTancament = false;

    ngOnInit(): void {
        this.mapState.idMunicipiSeleccionat$
            .pipe(takeUntil(this.destroy$))
            .subscribe(id => {
                if (id) {
                    this.visible = true;
                    this.animantTancament = false;
                } else {
                    this.tancar();
                }
            });
    }

    tancar(): void {
        if (!this.visible) return;

        this.animantTancament = true;

        setTimeout(() => {
            this.visible = false;
            this.animantTancament = false;
        }, 200);
    }

    onBackdropClick(): void {
        this.mapState.idMunicipiSeleccionat$.next(null);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }


}
