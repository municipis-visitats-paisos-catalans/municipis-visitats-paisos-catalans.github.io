import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Footer } from 'src/app/components/footer/footer';
import { ImportExport } from 'src/app/pages/configuracio/import-export/import-export';

@Component({
    selector: 'jmp-configuracio-page',
    imports: [ImportExport, Footer],
    templateUrl: './configuracio-page.html',
    styleUrl: './configuracio-page.scss'
})
export class ConfiguracioPage {

    public router = inject(Router);
}
