import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AppStateService } from 'src/app/services/app-state.service';
import { DadesMunicipi, DadesMunicipis, PersistenciaMunicipisVisitatsService } from 'src/app/services/persistencia-municipis-visitats.service';

@Component({
    selector: 'jmp-import-export',
    imports: [],
    templateUrl: './import-export.html',
    styleUrl: './import-export.scss'
})
export class ImportExport {

    private appState = inject(AppStateService);
    private persistencia = inject(PersistenciaMunicipisVisitatsService);
    private router = inject(Router);

    constructor() { }

    exportar() {
        let dadesMunicipis: DadesMunicipis = this.persistencia.crearDadesMunicipis();

        let visitats = Object.values(dadesMunicipis).filter(e => e.data).length;
        let totals = Object.keys(this.appState.municipis).length;

        const json = {
            "type": "municipis-visitats",
            "version": 1,
            "source": "https://municipis-visitats-paisos-catalans.github.io/",

            "autor": "Jordi Mas Parramon",
            "exportat-el": new Date().toLocaleString('ca-ES', { dateStyle: 'long', timeStyle: 'short' }),
            "percentatge": `${visitats}/${totals} (${(visitats / totals * 100).toFixed(2)}%)`,

            "municipis-visitats": dadesMunicipis,
        };

        console.log(json);

        this.descarregarJSON(json);
    }

    importar(json) {

        // this.persistencia.carregarDadesMunicipis(json["municipis-visitats"]);

        let dadesMunicipis: DadesMunicipis = json["municipis-visitats"];

        for (const [id, { data, nota }] of Object.entries(dadesMunicipis)) {
            if (!this.appState.municipis[id]) continue;
            const visitaResultant = this.resoldreConflicteDadesDuplicades(
                { data: this.appState.municipis[id].dataVisita, nota: this.appState.municipis[id].nota },
                { data, nota }

            );
            if (visitaResultant.data) this.appState.municipis[id].dataVisita = new Date(visitaResultant.data);
            if (visitaResultant.nota) this.appState.municipis[id].nota = visitaResultant.nota;
        }

        console.log("JSON importat", json["municipis-visitats"]);

        // Guardar canvis i tornar a la pantalla principal //
        this.persistencia.guardar();
        this.router.navigate(["/"]);
    }

    resoldreConflicteDadesDuplicades(
        visita1: DadesMunicipi,
        visita2: DadesMunicipi
    ): DadesMunicipi {
        const resultat: DadesMunicipi = {};

        const data = this.resoldreData(visita1.data, visita2.data);
        const nota = this.resoldreNota(visita1, visita2);

        if (data !== undefined) resultat.data = data;
        if (nota !== undefined) resultat.nota = nota;

        return resultat;
    }

    private resoldreData(data1?: string, data2?: string): string | undefined {
        if (!data1) return data2;
        if (!data2) return data1;
        if (data1 === data2) return data1;

        return new Date(data1) <= new Date(data2) ? data1 : data2;
    }

    private resoldreNota(visita1: DadesMunicipi, visita2: DadesMunicipi): string | undefined {
        const nota1 = visita1.nota?.trim();
        const nota2 = visita2.nota?.trim();

        if (!nota1) return nota2 || undefined;
        if (!nota2) return nota1;
        if (nota1 === nota2) return nota1;

        const visites = [
            { data: visita1.data, nota: nota1 },
            { data: visita2.data, nota: nota2 }
        ];

        visites.sort((a, b) => {
            if (!a.data && !b.data) return 0;
            if (!a.data) return -1;
            if (!b.data) return 1;

            return new Date(a.data).getTime() - new Date(b.data).getTime();
        });

        return visites.map(v => v.nota).join('\n\n');
    }




    descarregarJSON(obj: any) {
        const json = JSON.stringify(obj, null, 4);

        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "municipis-visitats.json";
        a.click();

        URL.revokeObjectURL(url);
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        if (file.type !== "application/json" && !file.name.endsWith(".json")) {
            console.error("No és JSON");
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            try {
                const text = reader.result as string;
                const json = JSON.parse(text);

                this.importar(json);

            } catch (e) {
                console.error("JSON invàlid", e);
            }
            finally {
                input.value = "";
            }
        };

        reader.readAsText(file);
    }
}
