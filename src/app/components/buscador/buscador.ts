import { TextFieldModule } from '@angular/cdk/text-field';
import { AsyncPipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Resultat } from 'src/app/components/buscador/resultat/resultat';
import { Municipi } from 'src/app/models/municipi';
import { AppStateService } from 'src/app/services/app-state.service';
import { MapaStateService } from 'src/app/services/mapa-state.service';

@Component({
    selector: 'jmp-buscador',
    imports: [
        Resultat,
        MatFormFieldModule,
        MatInputModule,
        TextFieldModule,
        FormsModule,
        AsyncPipe
    ],
    templateUrl: './buscador.html',
    styleUrl: './buscador.scss'
})
export class Buscador implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild("input") input: ElementRef<HTMLInputElement>;

    appState = inject(AppStateService);
    mapState = inject(MapaStateService);

    textBuscar$ = new BehaviorSubject<string>("");
    private subscripcioTextBuscar: Subscription;

    resultats: Municipi[];


    ngOnInit() {
        this.subscripcioTextBuscar = this.textBuscar$.subscribe(text => {
            if (!text) {
                this.resultats = [];
                return;
            }
            this.resultats = Object.values(this.appState.municipis).filter(m => {
                return m.nom.toLowerCase().includes(
                    text.toLowerCase().trim()
                );
            })
        })
    }

    ngAfterViewInit() {
        this.input.nativeElement.focus();
    }

    ngOnDestroy() { this.subscripcioTextBuscar.unsubscribe(); }

}
