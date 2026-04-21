import { Component, HostListener } from '@angular/core';
import { Footer } from 'src/app/components/footer/footer';
import { Mapa } from './components/mapa/mapa';

@Component({
    selector: 'app-root',
    imports: [Mapa, Footer],
    templateUrl: './app.html',
    styleUrl: './app.scss'
})
export class App {

    public scrolled: boolean;

    constructor() { }

}
