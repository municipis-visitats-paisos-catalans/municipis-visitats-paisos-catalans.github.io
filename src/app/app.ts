import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { skip, Subject, takeUntil } from 'rxjs';
import { ModalComponent } from 'src/app/components/modal/modal';
import { MapaStateService } from 'src/app/services/mapa-state.service';
import { Mapa } from './components/mapa/mapa';

@Component({
    selector: 'app-root',
    imports: [Mapa, ModalComponent],
    templateUrl: './app.html',
    styleUrl: './app.scss'
})
export class App implements OnInit {

    private route = inject(ActivatedRoute);
    private router = inject(Router);

    private mapState = inject(MapaStateService);

    private destroy$ = new Subject<void>();


    ngOnInit() {
        // URL -> estat //
        this.route.paramMap
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                let id = location.pathname.split("/")[1] || null;
                this.mapState.idMunicipiSeleccionat$.next(id ? `relation/${id}` : null);
            });

        // estat -> URL //
        this.mapState.idMunicipiSeleccionat$
            .pipe(takeUntil(this.destroy$), skip(1))
            .subscribe(id => {
                if (id) id = id.replace("relation/", "");
                this.router.navigateByUrl(id ?? "");
            });
    }


    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
